import React, { useState, useRef, useEffect } from "react";
import { geminiAgent } from "../services/geminiService";
import { ChatMessage } from "../types";
import { Send, Bot, User, Sparkles, Mic, MicOff, X } from "lucide-react";
import * as OpenCC from "opencc-js";

// 建立簡體轉繁體轉換器
const converter = OpenCC.Converter({ from: "cn", to: "tw" });

// 檢測文字是否包含中文
const containsChinese = (text: string): boolean => {
  return /[\u4e00-\u9fff]/.test(text);
};

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface RightPanelProps {
  className?: string;
}

// 語言選擇對話框組件
const LanguageDialog: React.FC<{
  text: string;
  onSelect: (useTraditional: boolean) => void;
  onClose: () => void;
}> = ({ text, onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">確認文字格式</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="bg-gray-100 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600 mb-1">語音辨識結果：</p>
          <p className="text-gray-800 font-medium">{text}</p>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          請選擇您想要使用的文字格式：
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => onSelect(true)}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-medium hover:from-amber-500 hover:to-orange-600 transition shadow-lg"
          >
            🇹🇼 繁體中文
          </button>
          <button
            onClick={() => onSelect(false)}
            className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
          >
            🇨🇳 簡體中文
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-3">
          選擇後會記住您的偏好
        </p>
      </div>
    </div>
  );
};

export const RightPanel: React.FC<RightPanelProps> = ({ className }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "0",
      role: "model",
      content:
        "嗨！我是您的 AI 財務助理 ✨\n\n我可以幫您：\n📝 記錄收支\n📊 分析消費\n📈 生成報表\n\n請問今天想記什麼呢？",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [pendingText, setPendingText] = useState("");
  const [languagePreference, setLanguagePreference] = useState<
    "traditional" | "simplified" | null
  >(() => {
    // 從 localStorage 讀取用戶偏好
    const saved = localStorage.getItem("languagePreference");
    return saved as "traditional" | "simplified" | null;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // 處理語音辨識結果
  const handleSpeechResult = (transcript: string) => {
    if (containsChinese(transcript)) {
      // 如果已有語言偏好，直接套用
      if (languagePreference === "traditional") {
        setInput(converter(transcript));
      } else if (languagePreference === "simplified") {
        setInput(transcript);
      } else {
        // 沒有偏好，顯示對話框詢問
        setPendingText(transcript);
        setShowLanguageDialog(true);
      }
    } else {
      // 非中文，直接使用
      setInput(transcript);
    }
  };

  // 處理語言選擇
  const handleLanguageSelect = (useTraditional: boolean) => {
    const preference = useTraditional ? "traditional" : "simplified";
    setLanguagePreference(preference);
    localStorage.setItem("languagePreference", preference);

    if (useTraditional) {
      setInput(converter(pendingText));
    } else {
      setInput(pendingText);
    }

    setShowLanguageDialog(false);
    setPendingText("");
  };

  // Check for speech recognition support
  useEffect(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "zh-TW";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join("");

        // 如果是最終結果，處理語言轉換
        const isFinal = event.results[event.results.length - 1]?.isFinal;
        if (isFinal) {
          handleSpeechResult(transcript);
        } else {
          // 中間結果，暫時顯示原始文字
          setInput(transcript);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [languagePreference]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInput("");
      recognitionRef.current.lang = "zh-TW";
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // 重置語言偏好（可選功能）
  const resetLanguagePreference = () => {
    setLanguagePreference(null);
    localStorage.removeItem("languagePreference");
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const responseText = await geminiAgent.sendMessage(userMsg.content);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "model",
        content: responseText,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "model",
        content:
          "Sorry, I encountered an error connecting to Gemini. Please check your API Key.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={`flex flex-col h-full bg-gradient-to-b from-amber-50/30 to-white ${className}`}
    >
      {/* Language Selection Dialog */}
      {showLanguageDialog && (
        <LanguageDialog
          text={pendingText}
          onSelect={handleLanguageSelect}
          onClose={() => {
            setShowLanguageDialog(false);
            setInput(pendingText);
            setPendingText("");
          }}
        />
      )}

      {/* Header - Modern Style */}
      <div className="p-4 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white">
          <Sparkles size={20} />
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-white text-base">AI 助理</h2>
          <p className="text-xs text-amber-100">Powered by Gemini</p>
        </div>
        {/* 語言偏好指示器 */}
        {languagePreference && (
          <button
            onClick={resetLanguagePreference}
            className="text-xs px-3 py-1.5 bg-white/20 backdrop-blur text-white rounded-full hover:bg-white/30 transition font-medium"
            title="點擊重置語言偏好"
          >
            {languagePreference === "traditional" ? "🇹🇼 繁體" : "🇨🇳 簡體"}
          </button>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`flex max-w-[85%] gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`
                    w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center shadow-md
                    ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600"
                        : "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
                    }
                `}
              >
                {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>

              <div
                className={`
                    p-4 rounded-2xl text-sm shadow-md whitespace-pre-wrap leading-relaxed
                    ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-tr-sm"
                        : "bg-white text-gray-800 rounded-tl-sm border border-gray-100"
                    }
                `}
              >
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start w-full">
            <div className="flex max-w-[85%] gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-md">
                <Bot size={16} />
              </div>
              <div className="bg-white p-4 rounded-2xl rounded-tl-sm border border-gray-100 shadow-md flex gap-1.5 items-center">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"></span>
                <span
                  className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></span>
                <span
                  className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Modern */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="relative flex gap-2">
          {/* Voice Input Button */}
          {speechSupported && (
            <button
              onClick={toggleListening}
              disabled={isLoading}
              className={`p-3 rounded-xl transition-all duration-300 flex-shrink-0 ${
                isListening
                  ? "bg-gradient-to-r from-red-500 to-rose-500 text-white animate-pulse shadow-lg shadow-red-200"
                  : "bg-gray-100 text-gray-500 hover:bg-amber-100 hover:text-amber-600"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={isListening ? "停止錄音" : "語音輸入"}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          )}

          <div className="relative flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isListening
                  ? "🎤 正在聆聽..."
                  : "輸入訊息或點擊麥克風語音輸入..."
              }
              className={`w-full bg-gray-50 text-gray-800 rounded-xl pl-4 pr-14 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 focus:bg-white resize-none h-14 custom-scrollbar transition-all border border-gray-200 ${
                isListening
                  ? "ring-2 ring-red-300 bg-red-50 border-red-300"
                  : ""
              }`}
              disabled={isListening}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim() || isListening}
              className="absolute right-2 top-2 p-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl hover:from-amber-500 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-2">
          {isListening
            ? "🎤 說完後點擊麥克風停止，或等待自動結束"
            : "AI 可能會犯錯，請自行確認重要資訊"}
        </p>
      </div>
    </div>
  );
};

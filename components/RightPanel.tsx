import React, { useState, useRef, useEffect } from "react";
import { geminiAgent, setCustomApiKey } from "../services/geminiService";
import { ChatMessage } from "../types";
import { Send, Bot, User, Sparkles, Mic, MicOff, Globe } from "lucide-react";
import * as OpenCC from "opencc-js";
import {
  useLanguage,
  containsChinese,
  isSimplifiedChinese,
  Language,
} from "../i18n";
import { ApiKeyDialog } from "./ApiKeyDialog";

// Create Simplified to Traditional Chinese converter
const converter = OpenCC.Converter({ from: "cn", to: "tw" });

// Language selector dropdown component
const LanguageSelector: React.FC = () => {
  const { language, setLanguage, setIsManuallySet, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: "en", label: "EN", flag: "🌐" },
    { code: "zh-TW", label: "繁體", flag: "🇹🇼" },
    { code: "zh-CN", label: "简体", flag: "🇨🇳" },
  ];

  const currentLang =
    languages.find((l) => l.code === language) || languages[0];

  const handleSelect = (code: Language) => {
    setLanguage(code);
    setIsManuallySet(true);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white/20 backdrop-blur text-white rounded-full hover:bg-white/30 transition font-medium"
      >
        <Globe size={12} />
        <span>
          {currentLang.flag} {currentLang.label}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 min-w-[100px]">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition ${
                  language === lang.code
                    ? "bg-amber-50 text-amber-600 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
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

export const RightPanel: React.FC<RightPanelProps> = ({ className }) => {
  const { language, setLanguage, isManuallySet, setIsManuallySet, t } =
    useLanguage();

  // Generate initial greeting based on language
  const getInitialGreeting = (): string => {
    return `${t("aiGreeting")}\n\n${t("aiHelpIntro")}\n${t("aiHelp1")}\n${t("aiHelp2")}\n${t("aiHelp3")}\n\n${t("aiPrompt")}`;
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "0",
      role: "model",
      content: getInitialGreeting(),
    },
  ]);

  // Update greeting when language changes
  useEffect(() => {
    setMessages([
      {
        id: "0",
        role: "model",
        content: getInitialGreeting(),
      },
    ]);
  }, [language]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Handle speech recognition result - auto-convert based on current language setting
  const handleSpeechResult = (transcript: string) => {
    if (containsChinese(transcript)) {
      // If Traditional Chinese is selected, auto-convert
      if (language === "zh-TW") {
        setInput(converter(transcript));
      } else if (language === "zh-CN") {
        // Simplified Chinese, keep as-is
        setInput(transcript);
      } else {
        // English mode with Chinese input, convert to Traditional and switch language
        setInput(converter(transcript));
        if (!isManuallySet) {
          setLanguage("zh-TW");
        }
      }
    } else {
      // Non-Chinese, use directly
      setInput(transcript);
    }
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

        // If final result, process language conversion
        const isFinal = event.results[event.results.length - 1]?.isFinal;
        if (isFinal) {
          handleSpeechResult(transcript);
        } else {
          // Interim result, convert display based on language setting
          if (language === "zh-TW" && containsChinese(transcript)) {
            setInput(converter(transcript));
          } else {
            setInput(transcript);
          }
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
  }, [language]);

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Auto-detect language from user input (only if not manually set)
    if (!isManuallySet && containsChinese(input)) {
      // Check if it's simplified Chinese
      if (isSimplifiedChinese(input)) {
        setLanguage("zh-CN");
      } else {
        // Default to Traditional Chinese for Chinese input
        setLanguage("zh-TW");
      }
    }

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
    } catch (error: any) {
      console.error(error);

      // Check if it's an API key error
      if (error?.isApiKeyError || error?.message === "API_KEY_INVALID") {
        setShowApiKeyDialog(true);
        const errorMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "model",
          content:
            language === "en"
              ? "The API key is invalid or has exceeded its quota. Please provide your own API key or try again later."
              : language === "zh-CN"
                ? "API Key 无效或已超出使用额度。请提供您自己的 API Key，或稍后再试。"
                : "API Key 無效或已超出使用額度。請提供您自己的 API Key，或稍後再試。",
        };
        setMessages((prev) => [...prev, errorMsg]);
      } else {
        const errorMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "model",
          content:
            "Sorry, I encountered an error connecting to Gemini. Please check your API Key.",
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle custom API key submission
  const handleApiKeySubmit = (apiKey: string) => {
    setCustomApiKey(apiKey);
    setShowApiKeyDialog(false);

    // Add confirmation message
    const confirmMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "model",
      content:
        language === "en"
          ? "Your API key has been set. You can now continue using the AI assistant. Your key is stored only in this browser session and will be cleared when you close the tab."
          : language === "zh-CN"
            ? "您的 API Key 已设置成功。现在可以继续使用 AI 助手。您的 Key 仅储存于此浏览器会话中，关闭分页后将自动清除。"
            : "您的 API Key 已設置成功。現在可以繼續使用 AI 助手。您的 Key 僅儲存於此瀏覽器會話中，關閉分頁後將自動清除。",
    };
    setMessages((prev) => [...prev, confirmMsg]);
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
      {/* Header - Modern Style */}
      <div className="p-4 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white">
          <Sparkles size={20} />
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-white text-base">{t("aiTitle")}</h2>
          <p className="text-xs text-amber-100">{t("aiSubtitle")}</p>
        </div>
        {/* Language Selector */}
        <LanguageSelector />
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
              title={isListening ? "Stop recording" : "Voice input"}
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
                isListening ? "🎤 Listening..." : t("inputPlaceholder")
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
            ? "🎤 Tap mic to stop or wait for auto-end"
            : t("aiDisclaimer")}
        </p>
      </div>

      {/* API Key Dialog */}
      <ApiKeyDialog
        isOpen={showApiKeyDialog}
        onClose={() => setShowApiKeyDialog(false)}
        onSubmit={handleApiKeySubmit}
      />
    </div>
  );
};

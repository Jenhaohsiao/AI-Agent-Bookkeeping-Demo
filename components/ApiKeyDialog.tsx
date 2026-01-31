import React, { useState } from "react";
import { X, Key, ExternalLink, ShieldCheck, AlertTriangle } from "lucide-react";
import { useLanguage } from "../i18n";

interface ApiKeyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (apiKey: string) => void;
}

export const ApiKeyDialog: React.FC<ApiKeyDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const { language } = useLanguage();

  const texts = {
    title: {
      en: "API Key Required",
      "zh-TW": "需要 API Key",
      "zh-CN": "需要 API Key",
    },
    description: {
      en: "The default API key is unavailable (expired, quota exceeded, or invalid). You have two options:",
      "zh-TW": "預設的 API Key 目前無法使用（可能已過期、額度用盡或失效）。您有兩個選擇：",
      "zh-CN": "默认的 API Key 目前无法使用（可能已过期、额度用尽或失效）。您有两个选择：",
    },
    option1Title: {
      en: "Option 1: Wait",
      "zh-TW": "選項一：等待",
      "zh-CN": "选项一：等待",
    },
    option1Desc: {
      en: "Please try again after 24 hours. The API quota may reset by then.",
      "zh-TW": "請於 24 小時後再試。屆時 API 額度可能已重置。",
      "zh-CN": "请于 24 小时后再试。届时 API 额度可能已重置。",
    },
    option2Title: {
      en: "Option 2: Use Your Own Key",
      "zh-TW": "選項二：使用您自己的 Key",
      "zh-CN": "选项二：使用您自己的 Key",
    },
    option2Desc: {
      en: "Enter your own Google Gemini API key below.",
      "zh-TW": "在下方輸入您自己的 Google Gemini API Key。",
      "zh-CN": "在下方输入您自己的 Google Gemini API Key。",
    },
    getKeyLink: {
      en: "Get your free API key from Google AI Studio",
      "zh-TW": "從 Google AI Studio 取得免費 API Key",
      "zh-CN": "从 Google AI Studio 获取免费 API Key",
    },
    placeholder: {
      en: "Paste your API key here...",
      "zh-TW": "在此貼上您的 API Key...",
      "zh-CN": "在此粘贴您的 API Key...",
    },
    privacyNotice: {
      en: "Your API key is stored only in your browser's session storage. It will be cleared when you close the tab. We do not collect or store your key on any server.",
      "zh-TW": "您的 API Key 僅儲存於瀏覽器的 Session Storage 中，關閉分頁後即自動清除。我們不會在任何伺服器上收集或儲存您的 Key。",
      "zh-CN": "您的 API Key 仅储存于浏览器的 Session Storage 中，关闭分页后即自动清除。我们不会在任何服务器上收集或储存您的 Key。",
    },
    submit: {
      en: "Use This Key",
      "zh-TW": "使用此 Key",
      "zh-CN": "使用此 Key",
    },
    cancel: {
      en: "Close",
      "zh-TW": "關閉",
      "zh-CN": "关闭",
    },
  };

  const getText = (key: keyof typeof texts) => {
    return texts[key][language as keyof (typeof texts)[typeof key]] || texts[key].en;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onSubmit(apiKey.trim());
      setApiKey("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-amber-500 to-orange-500 rounded-t-2xl">
          <div className="flex items-center gap-2 text-white">
            <AlertTriangle size={24} />
            <h2 className="font-bold text-lg">{getText("title")}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          <p className="text-gray-600 text-sm">{getText("description")}</p>

          {/* Option 1: Wait */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <h3 className="font-semibold text-blue-800 mb-1">
              {getText("option1Title")}
            </h3>
            <p className="text-blue-600 text-sm">{getText("option1Desc")}</p>
          </div>

          {/* Option 2: Own Key */}
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-green-800">
              {getText("option2Title")}
            </h3>
            <p className="text-green-600 text-sm">{getText("option2Desc")}</p>

            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-green-700 hover:text-green-900 underline"
            >
              <ExternalLink size={14} />
              {getText("getKeyLink")}
            </a>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <Key
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={getText("placeholder")}
                  className="w-full pl-9 pr-16 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                >
                  {showKey ? "Hide" : "Show"}
                </button>
              </div>

              <button
                type="submit"
                disabled={!apiKey.trim()}
                className="w-full py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                <Key size={16} />
                {getText("submit")}
              </button>
            </form>
          </div>

          {/* Privacy Notice */}
          <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
            <ShieldCheck size={18} className="text-gray-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-500 leading-relaxed">
              {getText("privacyNotice")}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2 text-gray-600 hover:text-gray-800 font-medium transition"
          >
            {getText("cancel")}
          </button>
        </div>
      </div>
    </div>
  );
};

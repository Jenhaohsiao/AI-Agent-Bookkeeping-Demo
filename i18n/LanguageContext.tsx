import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  Language,
  t as translate,
  tArray as translateArray,
  getCategoryName as getCatName,
} from "./translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: Parameters<typeof translate>[0]) => string;
  tArray: (key: Parameters<typeof translateArray>[0]) => string[];
  getCategoryName: (category: string) => string;
  isManuallySet: boolean;
  setIsManuallySet: (value: boolean) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

const STORAGE_KEY = "ledger-language";
const MANUAL_KEY = "ledger-language-manual";

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Default to English
  const [language, setLanguageState] = useState<Language>("en");
  const [isManuallySet, setIsManuallySet] = useState(false);

  // Load saved language preference on mount
  useEffect(() => {
    const savedLang = localStorage.getItem(STORAGE_KEY) as Language | null;
    const wasManual = localStorage.getItem(MANUAL_KEY) === "true";

    if (savedLang && ["en", "zh-TW", "zh-CN"].includes(savedLang)) {
      setLanguageState(savedLang);
      setIsManuallySet(wasManual);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  const handleSetManually = (value: boolean) => {
    setIsManuallySet(value);
    localStorage.setItem(MANUAL_KEY, value.toString());
  };

  // Translation helper bound to current language
  const t = (key: Parameters<typeof translate>[0]): string => {
    return translate(key, language);
  };

  // Array translation helper bound to current language
  const tArray = (key: Parameters<typeof translateArray>[0]): string[] => {
    return translateArray(key, language);
  };

  // Category name helper bound to current language
  const getCategoryName = (category: string): string => {
    return getCatName(category, language);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        tArray,
        getCategoryName,
        isManuallySet,
        setIsManuallySet: handleSetManually,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

// Helper to detect if text contains Chinese characters
export const containsChinese = (text: string): boolean => {
  return /[\u4e00-\u9fff]/.test(text);
};

// Helper to detect if text is primarily Simplified Chinese
// (This is a heuristic - checks for common simplified-only characters)
export const isSimplifiedChinese = (text: string): boolean => {
  // Common simplified-only characters
  const simplifiedChars = /[这这个们为来对发与说时过动会国产业经关电视机学习]/;
  // Common traditional-only characters
  const traditionalChars = /[這個們為來對發與說時過動會國產業經關電視機學習]/;

  const hasSimplified = simplifiedChars.test(text);
  const hasTraditional = traditionalChars.test(text);

  // If has simplified chars and no traditional chars, it's simplified
  if (hasSimplified && !hasTraditional) return true;
  // If has traditional or both, assume traditional
  return false;
};

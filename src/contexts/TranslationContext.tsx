
import React, { createContext, useContext, useState, useEffect } from 'react';
import { english } from '../translations/english';
import { spanish } from '../translations/spanish';

type Language = 'en' | 'es';
type TranslationKey = keyof typeof english;

interface TranslationContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get initial language from localStorage or default to English
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('aql_language');
    return (savedLanguage as Language) || 'en';
  });

  // Update localStorage when language changes
  useEffect(() => {
    localStorage.setItem('aql_language', language);
    // Update the html lang attribute for accessibility
    document.documentElement.lang = language;
  }, [language]);

  // Translation function
  const t = (key: TranslationKey): string => {
    if (language === 'en') {
      return english[key] || key;
    } else {
      return spanish[key] || english[key] || key;
    }
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

// Custom hook to use the translation context
export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

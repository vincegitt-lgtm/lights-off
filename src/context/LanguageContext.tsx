import React, { createContext, useState, useContext, useEffect } from 'react';
import { translations, LanguageType } from '../utils/translations';

interface LanguageContextType {
  lang: LanguageType;
  setLang: (lang: LanguageType) => void;
  t: (key: keyof typeof translations['en']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<LanguageType>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('appLanguage') as LanguageType;
    if (savedLang) {
      setLangState(savedLang);
    }
  }, []);

  const setLang = (newLang: LanguageType) => {
    setLangState(newLang);
    localStorage.setItem('appLanguage', newLang);
  };

  const t = (key: keyof typeof translations['en']) => {
    return translations[lang][key] || translations['en'][key];
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
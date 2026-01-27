'use client';

import { createContext, useContext, useState } from 'react';
import en from '@/i18n/en';
import es from '@/i18n/es';

type Language = 'en' | 'es';

const translations = { en, es };

const LanguageContext = createContext<{
  lang: Language;
  t: (key: keyof typeof en) => string;
  setLang: (lang: Language) => void;
}>({
  lang: 'en',
  t: () => '',
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('lang') as Language;
      return savedLang || 'en';
    }
    return 'en';
  });

  // Guardar idioma
  const changeLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };

  const t = (key: keyof typeof en) => {
    return translations[lang][key];
  };

  return (
    <LanguageContext.Provider value={{ lang, t, setLang: changeLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);

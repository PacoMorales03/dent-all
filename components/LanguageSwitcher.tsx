'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value as 'en' | 'es')}
    >
      <option value="en">English</option>
      <option value="es">Español</option>
    </select>
  );
}

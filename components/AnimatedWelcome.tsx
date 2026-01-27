'use client';

import { useLanguage } from '@/context/LanguageContext';
import Typewriter from '@/components/TypeWriter';

export default function AnimatedWelcome() {
  const { t, lang } = useLanguage();

  return (
    <Typewriter
      key={lang} // 🔑 reinicia animación cuando cambia el idioma
      text={t('platform_animated_welcome')}
    />
  );
}

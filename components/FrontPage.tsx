"use client";
import Image from "next/image";

import { useLanguage } from "@/context/LanguageContext";

export default function FrontPage() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 pb-20 gap-10 sm:p-20 relative w-full h-full">
      <div className="absolute inset-0 bg-cover bg-center filter blur-sm scale-105" style={{ backgroundImage: 'url("/background.png")' }} />

      <div className="relative z-10 w-[50vw] max-w-75 min-w-30 aspect-square">
        <Image
          src="/dent-all.png"
          alt="Dent-All logo"
          fill
          className="object-contain"
          sizes="(max-width: 768px) 30vw, 20vw"
        />
      </div>
      <h1 className="relative z-10 font-bold text-[clamp(1rem,3vw,3rem)]">
        {t('slogan')}
      </h1>
    </div>
  );
}

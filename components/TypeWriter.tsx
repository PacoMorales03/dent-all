'use client';

import { useEffect, useState } from 'react';

export default function Typewriter({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayedText((prev) => {
        if (prev.length >= text.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + text[prev.length];
      });
    }, 60);

    return () => clearInterval(interval);
  }, [text]);

  return (
    <h1 className="text-2xl font-semibold">
      {displayedText}
      {displayedText.length < text.length && (
        <span className="animate-pulse">|</span>
      )}
    </h1>
  );
}

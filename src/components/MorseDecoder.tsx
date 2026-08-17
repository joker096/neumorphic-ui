import React, { useState } from "react";
import { useI18n } from '../lib/i18n';

const MORSE_MAP: Record<string, string> = {
  // Latin (ITU-R standard)
  A: ".-",
  B: "-...",
  C: "-.-.",
  D: "-..",
  E: ".",
  F: "..-.",
  G: "--.",
  H: "....",
  I: "..",
  J: ".---",
  K: "-.-",
  L: ".-..",
  M: "--",
  N: "-.",
  O: "---",
  P: ".--.",
  Q: "--.-",
  R: ".-.",
  S: "...",
  T: "-",
  U: "..-",
  V: "...-",
  W: ".--",
  X: "-..-",
  Y: "-.--",
  Z: "--..",
  // Cyrillic (Russian standard)
  А: ".",
  Б: "...-",
  В: "-...",
  Г: "..-",
  Д: "-..",
  Е: "-",
  Ж: "-.-.",
  З: ".-.",
  И: "..",
  Й: ".-.-",
  К: "..-.",
  Л: "-.-",
  М: "-.",
  Н: "...",
  О: ".-.-",
  П: "...-",
  Р: "..-.",
  С: "...-",
  Т: "...",
  У: "-.-",
  Ф: "-...",
  Х: ".-.-",
  Ц: "..--",
  Ч: "..-",
  Ш: "....",
  Щ: "...-",
  Ы: ".-.",
  Ь: "-..-",
  Ћ: "-.-.",
  Ќ: ".--.",
  "0": "-----",
  "1": ".----",
  "2": "..---",
  "3": "...--",
  "4": "....-",
  "5": ".....",
  "6": "-....",
  "7": "--...",
  "8": "---..",
  "9": "----.",
  " ": "/",
  ".": ".-.-.-",
  ",": "--..--",
  "?": "..--..",
  "!": "-.-.--",
  "-": "-....-",
  "/": "-..-.",
  "@": ".--.-.",
  "(": "-.--.",
  ")": "-.--.-",
};

export const encodeMorse = (text: string) => {
  return [...text]
    .map((char) => {
      const upper = char.toUpperCase();
      if (MORSE_MAP[upper]) {
        return MORSE_MAP[upper];
      }
      return char;
    })
    .join(" ");
};

export const decodeMorse = (morse: string) => {
  const reverseMap: Record<string, string> = {};
  // Reverse map - take first occurrence for each code
  for (const [k, v] of Object.entries(MORSE_MAP)) {
    if (!reverseMap[v]) reverseMap[v] = k;
  }
  return morse
    .split(" ")
    .map((m) => reverseMap[m] || m)
    .join("")
    .replace(/\//g, " ");
};

export const isMorseCode = (text: string) => {
  return /^[.\- /]{1,}$/.test(text.trim());
};

export const decodeIfMorse = (text: string) => {
  if (typeof text === "string" && isMorseCode(text)) return decodeMorse(text);
  return text;
};

export const MorseDecoder = ({
  encodedText,
}: {
  encodedText: string;
}) => {
  const { t } = useI18n();
  const [decoded, setDecoded] = useState("");

  const label = (key: string, fallback: string) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  const handleDecode = () => {
    setDecoded(decodeMorse(encodedText));
  };

  return (
    <div className="flex flex-col gap-2 mt-2 w-full">
      <div
        className={`p-3 rounded-md ${
          'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`text-[8px] font-mono tracking-widest px-2 py-0.5 rounded ${
              'bg-orange-500/20 text-orange-400'
            }`}
          >
            {label('morseDecoder.morseEncoded', 'MORSE ENCODED')}
          </div>
        </div>
        <div className="font-mono text[11px] leading-relaxed break-all opacity-80">
          {encodedText}
        </div>
        {!decoded ? (
          <button
            onClick={handleDecode}
            className={`mt-3 px-3 py-1.5 rounded flex items-center gap-2 font-mono text-[10px] tracking-widest transition-colors ${
              'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30'
            }`}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {label('morseDecoder.decode', 'DECODE MORSE')}
          </button>
        ) : (
          <div
            className={`mt-3 p-3 rounded-lg border ${
              'bg-amber-500/10 border-amber-500/20'
            }`}
          >
            <div
              className={`text-[9px] font-mono tracking-wider mb-1 ${
                'text-amber-500/70'
              }`}
            >
              {label('morseDecoder.decodedText', 'DECODED TEXT')}
            </div>
            <div
              className={`font-mono font-medium text-[13px] ${
                'text-amber-100'
              }`}
            >
              {decoded}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

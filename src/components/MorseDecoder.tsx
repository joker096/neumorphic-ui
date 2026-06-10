import React, { useState } from "react";

const MORSE_MAP: Record<string, string> = {
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
  const reverseMap = Object.entries(MORSE_MAP).reduce(
    (acc, [k, v]) => ({ ...acc, [v]: k }),
    {} as Record<string, string>,
  );
  return morse
    .split(" ")
    .map((m) => reverseMap[m] || m)
    .join("")
    .replace(/\//g, " ");
};

export const isMorseCode = (text: string) => {
  return /^[.\- /]{1,}$/.test(text.trim());
};

export const MorseDecoder = ({
  theme,
  encodedText,
}: {
  theme: "dark" | "light";
  encodedText: string;
}) => {
  const isDark = theme === "dark";
  const [decoded, setDecoded] = useState("");

  const handleDecode = () => {
    setDecoded(decodeMorse(encodedText));
  };

  return (
    <div className="flex flex-col gap-2 mt-2 w-full">
      <div
        className={`p-3 rounded-xl ${
          isDark
            ? "bg-[#1a3a5c] text-[#d4eaff]"
            : "bg-blue-100 text-blue-900 border border-blue-200"
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`text-[8px] font-mono tracking-widest px-2 py-0.5 rounded ${
              isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-500/10 text-orange-600"
            }`}
          >
            MORSE ENCODED
          </div>
        </div>
        <div className="font-mono text[11px] leading-relaxed break-all opacity-80">
          {encodedText}
        </div>
        {!decoded ? (
          <button
            onClick={handleDecode}
            className={`mt-3 px-3 py-1.5 rounded flex items-center gap-2 font-mono text-[10px] tracking-widest transition-colors ${
              isDark
                ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
                : "bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-300"
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
            DECODE MORSE
          </button>
        ) : (
          <div
            className={`mt-3 p-3 rounded-lg border ${
              isDark
                ? "bg-amber-500/10 border-amber-500/20"
                : "bg-amber-50 border-amber-200/50"
            }`}
          >
            <div
              className={`text-[9px] font-mono tracking-wider mb-1 ${
                isDark ? "text-amber-500/70" : "text-amber-600/70"
              }`}
            >
              DECODED TEXT
            </div>
            <div
              className={`font-mono font-medium text-[13px] ${
                isDark ? "text-amber-100" : "text-amber-900"
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

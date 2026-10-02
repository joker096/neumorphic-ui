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
  // Cyrillic (International Russian standard — same codes as Latin equivalents)
  А: ".-",
  Б: "-...",
  В: ".--",
  Г: "--.",
  Д: "-..",
  Е: ".",
  Ж: "...-",
  З: "--..",
  И: "..",
  Й: ".---",
  К: "-.-",
  Л: ".-..",
  М: "--",
  Н: "-.",
  О: "---",
  П: ".--.",
  Р: ".-.",
  С: "...",
  Т: "-",
  У: "..-",
  Ф: "..-.",
  Х: "....",
  Ц: "-.-.",
  Ч: "---.",
  Ш: "----",
  Щ: "--.--",
  Ъ: "--.--.",
  Ы: "-.--",
  Ь: "-..-",
  Э: "..-..",
  Ю: "..--",
  Я: ".-.-",
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

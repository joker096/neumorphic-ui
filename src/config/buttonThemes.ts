export type ThemeMode = 'light' | 'dark';
export type ButtonColor = 'default' | 'red' | 'yellow' | 'green' | 'blue';

interface ColorTheme {
  icon: string;
  hoverIcon: string;
  activeIcon: string;
  activeBg?: string;
  hoverBg?: string;
}

const darkThemes: Record<ButtonColor, ColorTheme> = {
  default: {
    icon: "text-white/70",
    hoverIcon: "group-hover:text-white",
    activeIcon: "text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]",
  },
  red: {
    icon: "text-red-400/80",
    hoverIcon: "group-hover:text-red-300 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]",
    activeIcon: "text-red-400 drop-shadow-[0_0_12px_rgba(248,113,113,0.8)] scale-105",
  },
  yellow: {
    icon: "text-amber-500",
    hoverIcon: "group-hover:text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]",
    activeIcon: "text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)] scale-105",
  },
  green: {
    icon: "text-teal-400",
    hoverIcon: "group-hover:text-teal-300 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]",
    activeIcon: "text-teal-400 drop-shadow-[0_0_12px_rgba(45,212,191,0.8)] scale-105",
  },
  blue: {
    icon: "text-blue-400",
    hoverIcon: "group-hover:text-blue-300 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]",
    activeIcon: "text-blue-400 drop-shadow-[0_0_12px_rgba(59,130,246,0.8)] scale-105",
  },
};

const lightThemes: Record<ButtonColor, ColorTheme> = {
  default: {
    icon: "text-slate-500",
    hoverIcon: "group-hover:text-slate-800",
    activeIcon: "text-slate-900 drop-shadow-[0_1px_1px_rgba(255,255,255,1)]",
  },
  red: {
    icon: "text-red-500",
    hoverIcon: "group-hover:text-red-600",
    activeIcon: "text-red-600 drop-shadow-[0_2px_4px_rgba(220,38,38,0.3)] scale-105",
  },
  yellow: {
    icon: "text-amber-500",
    hoverIcon: "group-hover:text-amber-400",
    activeIcon: "text-amber-500 drop-shadow-[0_1px_1px_rgba(255,255,255,1)] scale-105",
  },
  green: {
    icon: "text-teal-600",
    hoverIcon: "group-hover:text-teal-700",
    activeIcon: "text-teal-400 drop-shadow-[0_0_12px_rgba(45,212,191,0.8)] scale-105",
  },
  blue: {
    icon: "text-blue-600",
    hoverIcon: "group-hover:text-blue-700",
    activeIcon: "text-blue-600 drop-shadow-[0_1px_1px_rgba(255,255,255,1)] scale-105",
  },
};

export const BUTTON_THEMES: Record<ThemeMode, Record<ButtonColor, ColorTheme>> = {
  dark: darkThemes,
  light: lightThemes,
};

export function getButtonTheme(theme: ThemeMode, color: ButtonColor): ColorTheme {
  return BUTTON_THEMES[theme][color];
}

export const ACTIVE_DEFAULT_COLOR: Record<ThemeMode, string> = {
  dark: "text-orange-400 drop-shadow-[0_0_12px_rgba(251,146,60,0.8)] scale-105",
  light: "text-orange-500 scale-105 drop-shadow-[0_2px_4px_rgba(249,115,22,0.3)]",
};

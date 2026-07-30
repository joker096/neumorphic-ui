export type ThemeMode = 'light' | 'dark';
export type ButtonColor = 'default' | 'red' | 'yellow' | 'green' | 'blue' | 'orange' | 'purple' | 'emerald';
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon' | 'premium';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl' | 'icon-sm' | 'icon-md' | 'icon-lg';

export interface ColorTheme {
  icon: string;
  hoverIcon: string;
  activeIcon: string;
  activeBg?: string;
  hoverBg?: string;
  bg?: string;
}

const darkThemes: Record<ButtonColor, ColorTheme> = {
  default: {
    icon: "text-white/70",
    hoverIcon: "group-hover:text-white",
    activeIcon: "text-orange-400",
  },
  red: {
    icon: "text-red-400/80",
    hoverIcon: "group-hover:text-red-300",
    activeIcon: "text-red-400",
  },
  yellow: {
    icon: "text-amber-500",
    hoverIcon: "group-hover:text-amber-400",
    activeIcon: "text-amber-400",
  },
  green: {
    icon: "text-teal-400",
    hoverIcon: "group-hover:text-teal-300",
    activeIcon: "text-teal-400",
  },
  blue: {
    icon: "text-blue-400",
    hoverIcon: "group-hover:text-blue-300",
    activeIcon: "text-blue-400",
  },
  orange: {
    icon: "text-orange-400/80",
    hoverIcon: "group-hover:text-orange-300",
    activeIcon: "text-orange-400",
  },
  purple: {
    icon: "text-purple-400",
    hoverIcon: "group-hover:text-purple-300",
    activeIcon: "text-purple-400",
  },
  emerald: {
    icon: "text-emerald-400",
    hoverIcon: "group-hover:text-emerald-300",
    activeIcon: "text-emerald-400",
  },
};

const lightThemes: Record<ButtonColor, ColorTheme> = {
  default: {
    icon: "text-slate-500",
    hoverIcon: "group-hover:text-slate-800",
    activeIcon: "text-slate-900",
  },
  red: {
    icon: "text-red-500",
    hoverIcon: "group-hover:text-red-600",
    activeIcon: "text-red-600",
  },
  yellow: {
    icon: "text-amber-500",
    hoverIcon: "group-hover:text-amber-400",
    activeIcon: "text-amber-500",
  },
  green: {
    icon: "text-teal-600",
    hoverIcon: "group-hover:text-teal-700",
    activeIcon: "text-teal-500",
  },
  blue: {
    icon: "text-blue-600",
    hoverIcon: "group-hover:text-blue-700",
    activeIcon: "text-blue-600",
  },
  orange: {
    icon: "text-orange-500",
    hoverIcon: "group-hover:text-orange-400",
    activeIcon: "text-orange-500",
  },
  purple: {
    icon: "text-purple-500",
    hoverIcon: "group-hover:text-purple-400",
    activeIcon: "text-purple-500",
  },
  emerald: {
    icon: "text-emerald-600",
    hoverIcon: "group-hover:text-emerald-500",
    activeIcon: "text-emerald-500",
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
  dark: "text-orange-400",
  light: "text-orange-500",
};

// Unified spacing system
export const SPACING = {
  xs: '1',
  sm: '2',
  md: '3',
  lg: '4',
  xl: '5',
  '2xl': '6',
  '3xl': '8',
} as const;

// Unified sizing system
export const SIZE_MAP: Record<ButtonSize, string> = {
  sm: 'px-3 py-2.5 text-[13px] min-h-[40px]',
  md: 'px-4 py-2.5 text-[14px] min-h-[44px]',
  lg: 'px-5 py-3 text-base min-h-[48px]',
  xl: 'px-6 py-3.5 text-base min-h-[52px]',
  'icon-sm': 'w-8 h-8',
  'icon-md': 'w-10 h-10',
  'icon-lg': 'w-12 h-12',
};

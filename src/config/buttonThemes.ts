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

const darkThemes: Record<ButtonColor, ColorTheme> = {  default: {
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

// Unified sizing system
export const SIZE_MAP: Record<ButtonSize, string> = {
  sm: 'px-[var(--spacing-12)] py-[var(--spacing-10)] text-[length:var(--text-body-small)] min-h-[var(--control-height-md)]',
  md: 'px-[var(--spacing-16)] py-[var(--spacing-10)] text-[length:var(--text-button)] min-h-[var(--control-height-md)]',
  lg: 'px-[var(--spacing-20)] py-[var(--spacing-10)] text-[length:var(--text-body)] min-h-[var(--control-height-md)]',
  xl: 'px-[var(--spacing-24)] py-[var(--spacing-10)] text-[length:var(--text-body)] min-h-[var(--control-height-md)]',
  'icon-sm': 'w-[var(--control-size-sm)] h-[var(--control-size-sm)] min-w-[var(--control-height-md)] min-h-[var(--control-height-md)]',
  'icon-md': 'w-[var(--control-size-md)] h-[var(--control-size-md)] min-w-[var(--control-height-md)] min-h-[var(--control-height-md)]',
  'icon-lg': 'w-[var(--control-size-lg)] h-[var(--control-size-lg)] min-w-[var(--control-height-md)] min-h-[var(--control-height-md)]',
};

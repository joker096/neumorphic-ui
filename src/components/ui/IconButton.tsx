import React, {
  type ReactNode,
  type ButtonHTMLAttributes,
  cloneElement,
  isValidElement,
} from "react";
import { useTheme } from "../../contexts/ThemeContext";

export type IconButtonSize = "sm" | "md" | "lg";
export type IconButtonVariant = "ghost" | "filled" | "subtle" | "danger";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
  isDark?: boolean;
}

const ICON_SIZE: Record<IconButtonSize, number> = {
  sm: 14,
  md: 16,
  lg: 20,
};

const BOX_SIZE: Record<IconButtonSize, string> = {
  sm: "w-10 h-10",
  md: "w-10 h-10",
  lg: "w-12 h-12",
};

const BASE =
  "inline-flex items-center justify-center rounded-full cursor-pointer select-none transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] active:scale-95";

const TOUCH_TARGET = "min-w-[44px] min-h-[44px]";

const VARIANTS: Record<IconButtonVariant, { dark: string; light: string }> = {
  ghost: {
    dark: "bg-white/10 hover:bg-white/20 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]",
    light: "bg-black/5 hover:bg-black/10 text-slate-500 hover:text-slate-800",
  },
  subtle: {
    dark: "bg-transparent text-[var(--text-tertiary)] hover:bg-[var(--hover-bg-dark)] hover:text-[var(--text-primary)]",
    light: "bg-transparent text-slate-500 hover:bg-black/5 hover:text-slate-800",
  },
  filled: {
    dark: "bg-[var(--accent)] text-white hover:brightness-110 shadow-lg shadow-orange-500/20",
    light: "bg-[var(--accent)] text-white hover:brightness-110 shadow-lg shadow-orange-500/20",
  },
  danger: {
    dark: "bg-red-500/90 hover:bg-red-500 text-white hover:brightness-110",
    light: "bg-red-500 hover:bg-red-600 text-white hover:brightness-110",
  },
};

export function IconButton({
  icon,
  size = "md",
  variant = "ghost",
  isDark: isDarkProp,
  className = "",
  ...rest
}: IconButtonProps) {
  const { isDark: ctxDark } = useTheme();
  const isDark = isDarkProp ?? ctxDark;
  const themeClasses = isDark ? VARIANTS[variant].dark : VARIANTS[variant].light;
  const resolvedIcon =
    isValidElement<Record<string, unknown>>(icon) && icon.props?.size == null
      ? cloneElement(icon as React.ReactElement<{ size?: number }>, { size: ICON_SIZE[size] })
      : icon;

  return (
    <button
      type="button"
      className={`${BASE} ${TOUCH_TARGET} ${BOX_SIZE[size]} ${themeClasses} ${className}`}
      {...rest}
    >
      <span className="flex items-center justify-center">{resolvedIcon}</span>
    </button>
  );
}

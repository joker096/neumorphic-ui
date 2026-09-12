import React, {
  type ReactNode,
  type ButtonHTMLAttributes,
  cloneElement,
  isValidElement,
} from "react";

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
  sm: "w-[var(--control-size-sm)] h-[var(--control-size-sm)]",
  md: "w-[var(--control-size-md)] h-[var(--control-size-md)]",
  lg: "w-[var(--control-size-lg)] h-[var(--control-size-lg)]",
};

const BASE =
  "inline-flex items-center justify-center rounded-full cursor-pointer select-none transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 active:scale-95";

const TOUCH_TARGET = "min-w-11 min-h-11";

const VARIANTS: Record<IconButtonVariant, string> = {
  ghost: "bg-muted hover:bg-muted text-muted-foreground hover:text-foreground",
  subtle: "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
  filled: "bg-primary text-primary-foreground hover:brightness-110 shadow-lg shadow-primary/20",
  danger: "bg-destructive/90 hover:bg-destructive text-destructive-foreground hover:brightness-110",
};

export function IconButton({
  icon,
  size = "md",
  variant = "ghost",
  className = "",
  ...rest
}: IconButtonProps) {
  const themeClasses = VARIANTS[variant];
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

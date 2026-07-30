import React, { type ReactNode } from "react"
import { getButtonTheme, type ButtonVariant, type ButtonSize, SIZE_MAP, type ButtonColor, type ThemeMode } from "../../config/buttonThemes"
import { useTheme } from "../../contexts/ThemeContext"

export type { ButtonVariant, ButtonSize } from "../../config/buttonThemes"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  color?: ButtonColor
  children?: ReactNode
  icon?: ReactNode
  isActive?: boolean
  isDark?: boolean
}

export function Button({
  variant = "primary",
  size = "md",
  color = "default",
  children,
  icon,
  isActive = false,
  className = "",
  ...rest
}: ButtonProps) {
  const { isDark } = useTheme()
  const resolvedColor = isActive && color === "default" ? "orange" : color
  const resolvedTheme = getButtonTheme(isDark ? "dark" : "light" as ThemeMode, resolvedColor)

  // Primary/Secondary/Danger/Ghost/Icon shared base styles
  const variantBase: Record<ButtonVariant, string> = {
    primary: "bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:brightness-110",
    secondary: "bg-[var(--button-secondary-bg)] text-[var(--button-secondary-text)] hover:bg-[var(--button-secondary-hover-bg,var(--bg-tertiary))] border border-[var(--button-secondary-border)]",
    danger: "bg-red-500 text-[var(--text-primary)] hover:bg-red-600",
    ghost: "text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]",
    icon: "hover:bg-[var(--bg-secondary)]",
    premium: "bg-gradient-to-r from-orange-500 to-amber-500 text-[var(--text-primary)] shadow-lg shadow-orange-500/20 hover:brightness-110",
  }

  const base = variantBase[variant]
  const sizeStyle = SIZE_MAP[size]
  const common =
    "font-medium transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
  const activeState = isActive ? "scale-95" : variant === "icon" ? "group-hover:scale-[1.05]" : ""
  const rounded = variant === "icon" ? "rounded-full" : "rounded-lg"

  return (
    <button
      className={`${common} ${base} ${sizeStyle} ${rounded} ${className} ${activeState} group`}
      {...rest}
    >
      <span className="flex items-center justify-center gap-2">
        {children}
        {icon && <span className="flex items-center">{icon}</span>}
      </span>
    </button>
  )
}


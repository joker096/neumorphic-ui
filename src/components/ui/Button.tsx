import React, { type ReactNode, cloneElement, isValidElement } from "react"
import { type ButtonVariant, type ButtonSize, SIZE_MAP } from "../../config/buttonThemes"

export type { ButtonVariant, ButtonSize } from "../../config/buttonThemes"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children?: ReactNode
  icon?: ReactNode
  iconSize?: number
  isActive?: boolean
}

export function Button({
  variant = "primary",
  size = "md",
  children,
  icon,
  iconSize,
  isActive = false,
  type = "button",
  className = "",
  ...rest
}: ButtonProps) {
  const variantBase: Record<ButtonVariant, string> = {
    primary: "bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:brightness-110",
    secondary:
      "bg-[var(--button-secondary-bg)] text-[var(--button-secondary-text)] hover:bg-[var(--button-secondary-hover-bg,var(--bg-tertiary))] border border-[var(--button-secondary-border)]",
    danger: "bg-red-500 text-[var(--text-primary)] hover:bg-red-600",
    ghost: "text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]",
    icon: "hover:bg-[var(--bg-secondary)]",
    premium:
      "bg-gradient-to-r from-orange-500 to-amber-500 text-[var(--text-primary)] shadow-lg shadow-orange-500/20 hover:brightness-110",
  }

  const base = variantBase[variant]
  const sizeStyle = SIZE_MAP[size]
  const common =
    "font-medium transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
  const activeState = isActive
    ? "scale-95"
    : variant === "icon"
      ? "active:scale-95"
      : ""
  const rounded = variant === "icon" ? "rounded-full" : "rounded-lg"
  const isIconOnly = variant === "icon"

  const resolvedIcon =
    isValidElement(icon) && iconSize != null
      ? cloneElement(icon as React.ReactElement<{ size?: number }>, { size: iconSize })
      : icon

  return (
    <button
      type={type}
      className={`${common} ${base} ${sizeStyle} ${rounded} ${className} ${activeState} group ${isIconOnly ? "aspect-square" : ""}`}
      {...rest}
    >
      <span className="inline-flex items-center justify-center gap-2">
        {icon && !isIconOnly && <span className="inline-flex items-center">{resolvedIcon}</span>}
        {children}
        {isIconOnly && resolvedIcon}
      </span>
    </button>
  )
}

import React, { type ReactElement } from "react"

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "premium"
export type ButtonSize = "sm" | "md" | "lg"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: React.ReactNode
  className?: string
  icon?: React.ReactNode
}

export function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  icon,
  ...rest
}: ButtonProps) {
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  }[size]

  const premiumIconSize = {
    sm: "w-5 h-5",
    md: "w-7 h-7",
    lg: "w-10 h-10",
  }[size]

  let base: string

  switch (variant) {
    case "primary":
      base = "bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:brightness-110 active:scale-[0.98] active:translate-y-[1px]"
      break
    case "secondary":
      base = "bg-[var(--button-secondary-bg)] text-[var(--button-secondary-text)] hover:bg-[var(--button-secondary-hover-bg,var(--bg-tertiary))] border border-[var(--button-secondary-border)]"
      break
    case "danger":
      base = "bg-red-500 text-white hover:bg-red-600 active:scale-[0.98] active:translate-y-[1px]"
      break
    case "ghost":
      base = "text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] active:scale-[0.98]"
      break
    case "premium":
      base = "bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] rounded-full px-6 py-3 active:scale-[0.98]"
      break
    default:
      base = "bg-[var(--button-primary-bg)] text-[var(--button-primary-text)]"
  }

  const common = "font-medium transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"

  if (variant === "premium") {
    return (
      <button
        className={`${common} ${base} ${className || ""} group`}
        {...rest}
      >
        <span className="flex items-center gap-3">
          {children}
          {icon && (
            <span className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-105">
              {React.cloneElement(icon as ReactElement<{ className?: string }>, {
                className: "text-current",
              })}
            </span>
          )}
        </span>
      </button>
    )
  }

  return (
    <button
      className={`${common} ${icon ? "rounded-full" : "rounded-lg"} ${base} ${sizeStyles} ${className || ""} group`}
      {...rest}
    >
      <span className="flex items-center justify-center gap-2">
        {children}
        {icon && (
          <span className="w-6 h-6 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-105">
            {React.cloneElement(icon as ReactElement<{ className?: string }>, {
              className: "text-current",
            })}
          </span>
        )}
      </span>
    </button>
  )
}

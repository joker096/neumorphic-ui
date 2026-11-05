import React, { type ReactNode, cloneElement, isValidElement } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
import { type ButtonVariant, type ButtonSize, SIZE_MAP } from "../../config/buttonThemes"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium cursor-pointer select-none transition-all duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 font-sans active:transition-none",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-warm-black)] text-[var(--color-cream)] border border-[color-mix(in_srgb,var(--color-warm-black,transparent)_14%,transparent)] hover:bg-[var(--color-gold)] hover:text-[var(--color-warm-black)] shadow-[var(--shadow-btn-primary)] active:shadow-[var(--shadow-btn-primary-pressed)] active:scale-[0.97]",
        secondary:
          "border border-[var(--border-color)] bg-transparent text-[var(--text-foreground)] hover:bg-[var(--color-cream)] hover:text-[var(--color-warm-black)] shadow-[var(--shadow-btn-secondary)] active:shadow-[var(--shadow-btn-secondary-pressed)] active:scale-[0.97]",
        danger:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-[var(--shadow-btn-primary)] active:shadow-[var(--shadow-btn-primary-pressed)] active:scale-[0.97]",
        ghost:
          "text-[var(--text-foreground)] hover:bg-[var(--color-cream)] hover:text-[var(--color-warm-black)] shadow-[var(--shadow-btn-ghost)] active:shadow-[var(--shadow-btn-ghost-pressed)] active:scale-[0.97]",
        icon:
          "bg-transparent hover:bg-[var(--color-cream)] active:scale-[0.95]",
        premium:
          "bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-gold-hover)] text-[var(--color-warm-black)] font-semibold hover:brightness-110 shadow-[var(--shadow-btn-premium)] active:shadow-[var(--shadow-btn-premium-pressed)] active:scale-[0.97]",
      },
    },
    defaultVariants: { variant: "primary" },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  size?: ButtonSize
  children?: ReactNode
  icon?: ReactNode
  iconSize?: number
  isActive?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    children,
    icon,
    iconSize,
    isActive = false,
    type = "button",
    className = "",
    ...rest
  },
  ref,
) {
  const base = buttonVariants({ variant })
  const sizeStyle = SIZE_MAP[size]
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
      ref={ref}
      type={type}
      className={cn(base, sizeStyle, rounded, activeState, isIconOnly && "aspect-square", className)}
      {...rest}
    >
      <span className="inline-flex items-center justify-center gap-2">
        {icon && !isIconOnly && <span className="inline-flex items-center">{resolvedIcon}</span>}
        {children}
        {isIconOnly && resolvedIcon}
      </span>
    </button>
  )
})

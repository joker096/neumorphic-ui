import React, { type ReactNode, cloneElement, isValidElement } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
import { type ButtonVariant, type ButtonSize, SIZE_MAP } from "../../config/buttonThemes"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium cursor-pointer select-none transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[var(--shadow-btn-primary)] active:shadow-[var(--shadow-btn-primary-pressed)]",
        secondary: "border border-border bg-transparent text-foreground hover:bg-secondary active:scale-[0.98]",
        danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98]",
        ghost: "text-foreground hover:bg-secondary active:scale-[0.98]",
        icon: "hover:bg-secondary",
        premium:
          "bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] text-foreground hover:brightness-110 active:scale-[0.98]",
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

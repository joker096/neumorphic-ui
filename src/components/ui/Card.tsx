import React from "react"

export type CardVariant = "raised" | "inset" | "flat" | "double-bezel" | "glass"
export type CardSize = "sm" | "md" | "lg"

interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: CardVariant
  size?: CardSize
}

export function Card({
  children,
  className = "",
  variant = "raised",
  size = "md",
}: CardProps) {
  const padding = { sm: "p-3", md: "p-4", lg: "p-6" }[size]
  const radius = { sm: "rounded-lg", md: "rounded-xl", lg: "rounded-xl" }[size]

  let bg: string
  let border: string
  let shadow: string

  switch (variant) {
    case "inset":
      bg = "bg-[var(--card-inset-bg)]"
      border = "border-none"
      shadow = "shadow-[var(--shadow-neu-inset)]"
      break
    case "flat":
      bg = "bg-[var(--card-flat-bg)]"
      border = "border-none"
      shadow = ""
      break
    case "glass":
      bg = "bg-[var(--glass-bg)]"
      border = "border border-[var(--glass-border)]"
      shadow = "shadow-[var(--glass-shadow)]"
      break
    case "double-bezel":
      return (
        <div
          className={`${className || ""}`}
          style={{
            background: "var(--doppelrand-outer-bg)",
            padding: "var(--doppelrand-padding)",
            borderRadius: "var(--doppelrand-radius-outer)",
            border: "1px solid var(--doppelrand-outer-border)",
          }}
        >
          <div
            style={{
              background: "var(--card-raised-bg)",
              borderRadius: "var(--doppelrand-radius-inner)",
              boxShadow: "var(--doppelrand-inner-shadow)",
            }}
            className={`${padding} transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]`}
          >
            {children}
          </div>
        </div>
      )
    case "raised":
    default:
      bg = "bg-[var(--card-raised-bg)]"
      border = "border-none"
      shadow = "shadow-[var(--shadow-neu-raised)]"
      break
  }

  return (
    <div className={`${bg} ${border} ${shadow} ${radius} overflow-hidden ${className || ""}`}>
      <div className={`${padding} transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]`}>{children}</div>
    </div>
  )
}

import React from "react"

export type InputVariant = "default" | "search"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant
  className?: string
  error?: string
}

const INPUTMODE_MAP: Record<string, React.InputHTMLAttributes<HTMLInputElement>['inputMode']> = {
  tel: 'tel',
  email: 'email',
  url: 'url',
  search: 'search',
  number: 'numeric',
};

export function Input({
  variant = "default",
  className = "",
  type,
  autoComplete,
  inputMode,
  error,
  required,
  ...rest
}: InputProps) {
  const base = {
    default: "bg-[var(--input-bg)] text-[var(--input-text)] placeholder-[var(--input-placeholder)]",
    search: "bg-[var(--input-bg)] text-[var(--input-text)] placeholder-[var(--input-placeholder)]",
  }[variant]

  const resolvedInputMode = inputMode || (type ? INPUTMODE_MAP[type] : undefined);

  return (
    <div>
      <input
        type={type}
        autoComplete={autoComplete}
        inputMode={resolvedInputMode}
        required={required}
        className={
          "rounded-lg px-3 py-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2" +
          " " +
          (error ? "border border-red-500" : "border-none") +
          " " +
          base +
          " " +
          (className || "")
        }
        style={{
          boxShadow: variant === "search" ? "var(--inset-field-shadow)" : undefined,
        }}
        {...rest}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

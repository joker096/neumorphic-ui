import React from 'react'

interface Option {
  value: string
  label: string
}

interface FormSelectProps {
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  theme?: 'light' | 'dark'
  className?: string
}

export const FormSelect = ({
  value,
  onChange,
  options,
  placeholder,
  theme = 'dark',
  className = '',
}: FormSelectProps) => {
  const isDark = theme === 'dark'

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full h-8 rounded-lg text-xs outline-none px-2 ${
        isDark
          ? 'bg-card text-foreground'
          : 'bg-muted text-foreground'
      } ${className}`}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}





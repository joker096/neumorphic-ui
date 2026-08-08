import React from 'react'

export type CardElevation = 'raised' | 'inset' | 'flat'

export type CardPadding = 'none' | 'sm' | 'md' | 'lg'

export interface UnifiedCardProps {
  children: React.ReactNode
  className?: string
  elevation?: CardElevation
  padding?: CardPadding
}

export const UnifiedCard = ({
  children,
  className = '',
  elevation = 'raised',
  padding = 'md',
}: UnifiedCardProps) => {
  const elevationClass = {
    raised: 'shadow-[var(--shadow-neu-raised)]',
    inset: 'shadow-[var(--shadow-neu-inset)]',
    flat: '',
  }[elevation]

  const paddingClass = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }[padding]

  return (
    <div className={`${elevationClass} rounded-xl ${paddingClass} ${className}`}>
      {children}
    </div>
  )
}

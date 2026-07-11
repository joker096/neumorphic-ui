import React, { type ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
  className?: string;
  subtitle?: string;
  avatar?: ReactNode;
}

export function PageHeader({ title, onBack, right, className = '', subtitle, avatar }: PageHeaderProps) {
  return (
    <div className={`flex items-center gap-3 mb-4 shrink-0 ${className}`}>
      {onBack && (
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all bg-white/10 hover:bg-white/20 active:bg-white/30"
        >
          <ChevronLeft size={20} className="text-[var(--text-primary)]" />
        </button>
      )}
      {avatar && <div className="shrink-0">{avatar}</div>}
      <div className="flex-1 min-w-0">
        <h2 className="text-xl font-bold tracking-wide truncate text-[var(--text-primary)]">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs mt-0.5 truncate text-[var(--text-secondary)]">
            {subtitle}
          </p>
        )}
      </div>
      {right && <div className="shrink-0 flex items-center gap-2">{right}</div>}
    </div>
  );
}

import React, { type ComponentType } from 'react';

interface EmptyStateProps {
  icon?: ComponentType<{ size?: number; className?: string }>;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      {Icon && (
        <Icon size={48} className="mb-6 text-[var(--text-tertiary)]" />
      )}
      <p className="text-base font-semibold mb-2 text-[var(--text-primary)]">
        {title}
      </p>
      {subtitle && (
        <p className="text-sm text-[var(--text-secondary)] mb-4 max-w-[280px]">
          {subtitle}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

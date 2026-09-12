import React from 'react';

export interface SkeletonProps {
  rows?: number;
}

const PULSE = 'animate-pulse bg-[var(--bg-tertiary)] shadow-[var(--inset-field-shadow)]';

export const Skeleton = ({ rows = 4 }: SkeletonProps) => (
  <div className="flex flex-col gap-3" aria-busy="true">
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl border border-[var(--border-color)]">
        <div className={`w-10 h-10 rounded-full ${PULSE}`} />
        <div className="flex-1 flex flex-col gap-2">
          <div className={`h-2.5 rounded-full ${PULSE}`} />
          <div className={`h-2.5 w-2/3 rounded-full ${PULSE}`} />
        </div>
      </div>
    ))}
  </div>
);

import React from 'react';

interface StoryProgressBarProps {
  count: number;
  currentIndex: number;
  progress: number;
}

export const StoryProgressBar: React.FC<StoryProgressBarProps> = ({ count, currentIndex, progress }) => (
  <div className="absolute top-0 left-0 w-full flex gap-1 p-3 z-20" aria-hidden="true">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
        <div
          className="h-full bg-white transition-[width] duration-75"
          style={{ width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%' }}
        />
      </div>
    ))}
  </div>
);

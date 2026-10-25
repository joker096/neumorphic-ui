import type { ReactNode } from 'react';
import type { Story } from '../types';

const GAP_DEG = 4;

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const s = polar(cx, cy, r, startDeg);
  const e = polar(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

interface StoryRingProps {
  stories: Story[];
  size?: number;
  className?: string;
  children?: ReactNode;
}

/**
 * Segmented ring around an avatar. A single story draws a solid ring;
 * multiple stories draw arcs with a small gap. Seen arcs are muted, unseen accent.
 */
export function StoryRing({ stories, size = 56, className = '', children }: StoryRingProps) {
  const seenCount = stories.filter((s) => s.viewedByMe).length;
  const segments = stories.length;
  const stroke = Math.max(2, Math.round(size * 0.036));
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;

  const span = (360 - GAP_DEG * Math.max(0, segments - 1)) / Math.max(1, segments);
  const arcs: { d: string; seen: boolean }[] = [];
  for (let i = 0; i < segments; i++) {
    const start = i * (span + GAP_DEG);
    arcs.push({ d: arc(cx, cy, r, start, start + span), seen: i < seenCount });
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${segments} ${segments === 1 ? 'story' : 'stories'}, ${seenCount} seen`}
    >
      {children}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        {segments === 1 ? (
          <circle cx={cx} cy={cy} r={r} stroke="var(--story-ring-unseen)" strokeWidth={stroke} />
        ) : (
          <>
            <circle cx={cx} cy={cy} r={r} stroke="var(--story-ring-seen)" strokeWidth={stroke} opacity={0.55} />
            {arcs.map((a, i) => (
              <path
                key={i}
                d={a.d}
                stroke={a.seen ? 'var(--story-ring-seen)' : 'var(--story-ring-unseen)'}
                strokeWidth={stroke}
                strokeLinecap="round"
              />
            ))}
          </>
        )}
      </svg>
    </div>
  );
}

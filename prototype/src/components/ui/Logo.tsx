interface LogoProps {
  size?: number;
  inverse?: boolean;
  className?: string;
}

/** Product mark: speech bubble with a smiling face (spec §5). */
export function Logo({ size = 72, inverse = false, className }: LogoProps) {
  const bubble = inverse ? '#fff' : 'var(--primary)';
  const face = inverse ? 'var(--primary)' : '#fff';

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      role="img"
      aria-label="App logo"
    >
      <path
        d="M36 6C19.4 6 6 18.6 6 34.2c0 8.3 3.5 15.7 9.3 21V66l10.7-5.2c3.2.8 6.6 1.2 10 1.2 16.6 0 30-12.6 30-28.2S52.6 6 36 6Z"
        fill={bubble}
      />
      <g stroke={face} strokeWidth={3.4} strokeLinecap="round" fill="none">
        <path d="M23 31.5c1.9-2.8 5.4-2.8 7.3 0" />
        <path d="M41.7 31.5c1.9-2.8 5.4-2.8 7.3 0" />
        <path d="M26 40a10 10 0 0 0 20 0" />
      </g>
    </svg>
  );
}

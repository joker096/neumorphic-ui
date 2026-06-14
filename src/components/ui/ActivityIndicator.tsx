interface ActivityIndicatorProps {
  size?: number;
  color?: string;
}

export function ActivityIndicator({ size = 20, color }: ActivityIndicatorProps) {
  return (
    <div
      className="ios-spinner"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `conic-gradient(from 0deg, transparent 60%, ${color || 'var(--system-gray)'} 100%)`,
        WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2.5px))',
        mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2.5px))',
      }}
    />
  );
}

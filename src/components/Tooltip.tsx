import React, { useState, useRef, useEffect } from 'react';

export const Tooltip = ({ children, content, position = 'top', theme = 'dark' }: { children: React.ReactNode; content: string; position?: 'top' | 'bottom' | 'left' | 'right'; theme?: 'light' | 'dark' }) => {
  const [visible, setVisible] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    const handleScroll = () => setVisible(false);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const showTooltip = () => setVisible(true);
  const hideTooltip = () => setVisible(false);

  let containerStyle: React.CSSProperties = { position: 'relative', display: 'inline-block' };
  let tooltipStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 9999,
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    transform: 'translateY(-100%)',
  };

  switch (position) {
    case 'top':
      tooltipStyle = { ...tooltipStyle, top: '100%', left: '50%', transform: 'translate(-50%, -8px)' };
      break;
    case 'bottom':
      tooltipStyle = { ...tooltipStyle, bottom: '100%', left: '50%', transform: 'translate(-50%, 8px)' };
      break;
    case 'left':
      tooltipStyle = { ...tooltipStyle, left: '100%', top: '50%', transform: 'translate(-8px, -50%)' };
      break;
    case 'right':
      tooltipStyle = { ...tooltipStyle, right: '100%', top: '50%', transform: 'translate(8px, -50%)' };
      break;
  }

  return (
    <div ref={ref} onMouseEnter={showTooltip} onMouseLeave={hideTooltip} onFocus={showTooltip} onBlur={hideTooltip} tabIndex={0} style={containerStyle}>
      {children}
      {visible && (
        <div style={tooltipStyle} className={`px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-opacity shadow-lg ${isDark ? "bg-[#1a1d24] text-white" : "bg-white text-slate-800 border border-black/10"}`}>
          {content}
        </div>
      )}
    </div>
  );
};

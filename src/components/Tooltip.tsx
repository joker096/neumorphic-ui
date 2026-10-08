import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

/**
 * Gap between the anchor edge and the tooltip, and the breathing room kept
 * between the tooltip and the viewport edges.
 */
const GAP_PX = 8;
const VIEWPORT_MARGIN_PX = 8;
/** Touch has no hover: a tap reveals the hint, this is how long it stays. */
const TOUCH_AUTO_HIDE_MS = 2500;

const OPPOSITE: Record<TooltipPosition, TooltipPosition> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: TooltipPosition;
}

/**
 * Hover/focus/tap hint that renders through a portal into `<body>` so
 * `overflow:hidden` ancestors (chat scroll panes, sidebars) cannot clip it.
 *
 * Placement contract: `top` means the tooltip sits ABOVE the anchor — the
 * previous implementation inverted the axis (`top` rendered below). When the
 * preferred side lacks room the tooltip flips to the opposite side, then the
 * result is clamped inside the viewport. The effective side is exposed as
 * `data-placement` for tests and diagnostics.
 *
 * Accessibility: `role="tooltip"` + `aria-describedby` on the wrapper, Escape
 * dismisses the hint (WCAG 1.4.13), and the wrapper is deliberately NOT
 * focusable — focus events bubble from the real child control, so an extra
 * empty tab stop would only hurt keyboard navigation.
 */
export const Tooltip = ({ children, content, position = 'top' }: TooltipProps) => {
  const [visible, setVisible] = useState(false);
  const [placement, setPlacement] = useState<TooltipPosition>(position);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const anchorRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rawId = useId();
  const tooltipId = `tt-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  // Dismissal: scroll/resize anywhere (capturing, so inner scrollers count
  // too) and Escape, whichever surface the user is on.
  useEffect(() => {
    if (!visible) return;
    const hide = () => setVisible(false);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setVisible(false);
    };
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [visible]);

  // Touch auto-hide timer must not outlive the component.
  useEffect(() => () => {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
  }, []);

  // Measure anchor + tooltip and resolve the final coordinates. Runs before
  // paint so the hint never flashes at (0,0). Zero-size measurements (jsdom)
  // skip the flip so the requested placement stays observable in tests.
  useLayoutEffect(() => {
    if (!visible) return;
    const anchor = anchorRef.current;
    const tip = tooltipRef.current;
    if (!anchor || !tip) return;

    const a = anchor.getBoundingClientRect();
    const t = tip.getBoundingClientRect();
    let next: TooltipPosition = position;

    if (t.width > 0 || t.height > 0) {
      const space = {
        top: a.top,
        bottom: window.innerHeight - a.bottom,
        left: a.left,
        right: window.innerWidth - a.right,
      };
      const need = {
        top: t.height + GAP_PX,
        bottom: t.height + GAP_PX,
        left: t.width + GAP_PX,
        right: t.width + GAP_PX,
      };
      if (space[next] < need[next]) {
        const opposite = OPPOSITE[next];
        next = space[opposite] >= need[next] || space[opposite] > space[next] ? opposite : next;
      }
    }

    let top: number;
    let left: number;
    if (next === 'top') {
      top = a.top - t.height - GAP_PX;
      left = a.left + a.width / 2 - t.width / 2;
    } else if (next === 'bottom') {
      top = a.bottom + GAP_PX;
      left = a.left + a.width / 2 - t.width / 2;
    } else if (next === 'left') {
      left = a.left - t.width - GAP_PX;
      top = a.top + a.height / 2 - t.height / 2;
    } else {
      left = a.right + GAP_PX;
      top = a.top + a.height / 2 - t.height / 2;
    }

    const maxLeft = Math.max(VIEWPORT_MARGIN_PX, window.innerWidth - t.width - VIEWPORT_MARGIN_PX);
    const maxTop = Math.max(VIEWPORT_MARGIN_PX, window.innerHeight - t.height - VIEWPORT_MARGIN_PX);
    left = Math.min(Math.max(left, VIEWPORT_MARGIN_PX), maxLeft);
    top = Math.min(Math.max(top, VIEWPORT_MARGIN_PX), maxTop);

    setPlacement(next);
    setCoords({ top, left });
  }, [visible, position, content]);

  const show = () => setVisible(true);
  const hide = () => setVisible(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'touch') return;
    setVisible(true);
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    touchTimerRef.current = setTimeout(() => setVisible(false), TOUCH_AUTO_HIDE_MS);
  };

  return (
    <div
      ref={anchorRef}
      data-tooltip={content}
      aria-describedby={visible ? tooltipId : undefined}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onPointerDown={handlePointerDown}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      {children}
      {visible &&
        createPortal(
          <div
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            data-placement={placement}
            style={{ top: coords.top, left: coords.left, maxWidth: 'min(70vw, 260px)' }}
            className="fixed z-[var(--z-tooltip)] px-2 py-1 rounded-md text-xs font-medium leading-snug break-words whitespace-normal pointer-events-none animate-in fade-in duration-100 shadow-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-primary)]"
          >
            {content}
          </div>,
          document.body,
        )}
    </div>
  );
};

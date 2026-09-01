import type { ReactNode } from 'react';
import { X } from 'lucide-react';

export type ModalTheme = 'dark' | 'light';

export const resolveDark = (theme: ModalTheme | boolean | undefined): boolean =>
  theme === true || theme === 'dark' || theme === undefined;

/** Resolve the active theme from the DOM (the themed app wrapper sets [data-theme]).
 *  Used so portaled modals keep correct CSS-variable resolution outside their
 *  original React tree. */
export const currentTheme = (): ModalTheme => {
  if (typeof document === 'undefined') return 'dark';
  const el = document.querySelector('[data-theme]');
  const t = el?.getAttribute('data-theme');
  return t === 'light' ? 'light' : 'dark';
};

/* ---- Centered modal (dialog) ---- */

export const modalOverlay = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';

export const modalBackdrop = 'absolute inset-0 bg-black/60 backdrop-blur-sm';

export const modalSurface = (_isDark: boolean, maxWidth = 'max-w-[420px]') =>
  `relative w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card text-foreground p-6 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.65)] ring-1 ring-black/5`;

export const modalCloseClass = (_isDark: boolean) =>
  `min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center cursor-pointer transition-colors bg-muted hover:bg-muted text-foreground`;

export const modalTitleClass = (_isDark: boolean) => `text-lg font-bold text-foreground`;

export const modalSubtitleClass = (_isDark: boolean) => `text-xs mt-0.5 text-muted-foreground`;

export const modalIconWrapClass = (_isDark: boolean, size = 'w-9 h-9') =>
  `${size} rounded-full flex items-center justify-center shrink-0 bg-[var(--accent-soft)] text-[var(--accent)]`;

export function ModalCloseButton({
  isDark,
  onClick,
  label,
  className = '',
}: {
  isDark: boolean;
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label || 'Close'}
      className={`${modalCloseClass(isDark)} ${className}`}
    >
      <X size={18} />
    </button>
  );
}

export function ModalHeader({
  title,
  subtitle,
  icon,
  isDark,
  align = 'start',
  iconSize = 'w-9 h-9',
}: {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  isDark: boolean;
  align?: 'start' | 'center';
  iconSize?: string;
}) {
  if (!title && !subtitle && !icon) return null;
  const centered = align === 'center';
  return (
    <div
      className={`flex items-start justify-between gap-3 mb-4 ${
        centered ? 'flex-col items-center text-center' : ''
      }`}
    >
      <div className={`flex items-center gap-3 min-w-0 ${centered ? 'flex-col' : ''}`}>
        {icon && <div className={modalIconWrapClass(isDark, iconSize)}>{icon}</div>}
        <div className={centered ? 'text-center' : 'min-w-0'}>
          {title && <h3 className={modalTitleClass(isDark)}>{title}</h3>}
          {subtitle && <p className={modalSubtitleClass(isDark)}>{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

/* ---- Bottom sheet (action sheet) ---- */

export const sheetOverlay = 'fixed inset-0 z-[120] flex items-end justify-center';
export const sheetOverlayAbsolute = 'absolute inset-0 z-[60] flex items-end justify-center';
export const sheetBackdrop = 'absolute inset-0 bg-black/45 backdrop-blur-[2px]';
export const sheetSurface = (_isDark: boolean, extra = '') =>
  `relative w-full max-w-md mx-auto rounded-t-2xl p-2 pb-[max(8px,env(safe-area-inset-bottom))] shadow-2xl neu-raised bg-popover border-t border-border max-h-[80vh] overflow-y-auto ${extra}`;

export const sheetTitleClass = (_isDark: boolean) =>
  `px-4 py-2 text-xs font-semibold text-muted-foreground`;

export const sheetActionClass = (_isDark: boolean, danger = false, compact = false) =>
  `flex items-center gap-[var(--spacing-12)] w-full min-h-[var(--control-height-md)] ${compact ? 'px-[var(--spacing-12)] py-[var(--spacing-06)] text-[length:var(--text-body-small)]' : 'px-[var(--spacing-16)] py-[var(--spacing-10)] text-[length:var(--text-button)]'} text-left font-medium rounded-[var(--radius-card)] transition-colors cursor-pointer active:scale-[0.99] ${
    danger
      ? 'text-red-500 hover:bg-red-500/10'
      : 'text-foreground hover:bg-muted'
  }`;

export const sheetCancelClass = (_isDark: boolean, compact = false) =>
  `mt-[var(--spacing-04)] w-full min-h-[var(--control-height-md)] ${compact ? 'py-[var(--spacing-06)] text-[length:var(--text-body-small)]' : 'py-[var(--spacing-10)] text-[length:var(--text-button)]'} rounded-[var(--radius-card)] font-bold transition-colors cursor-pointer text-foreground hover:bg-muted`;

/* ---- Shared modal content primitives (theme-token based, match Story composer look) ---- */

/** Small uppercase section label used above inputs / groups. */
export const modalLabelClass =
  'text-xs uppercase tracking-widest font-bold mb-2 opacity-50 text-[var(--text-primary)]';

/** Consistent text input / textarea field.
 *  Uses the design token control height (44px) with an explicit text size so
 *  the field never inherits an unexpectedly large font. */
export const modalFieldClass =
  'w-full h-[var(--control-height-lg)] rounded-xl px-4 outline-none transition-colors bg-[var(--bg-tertiary)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]';

/** Full-width primary action button (accent). */
export const modalPrimaryBtnClass =
  'w-full h-10 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 bg-[var(--accent)] text-[var(--button-primary-text)] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_24px_-8px_var(--accent)]';

/** Secondary / ghost button. */
export const modalSecondaryBtnClass =
  'flex-1 h-10 text-sm font-bold rounded-xl transition-colors bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]';

/** Square icon-only primary action button (no w-full — safe inside sibling rows). */
export const modalPrimaryIconBtnClass =
  'w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 bg-[var(--accent)] text-[var(--button-primary-text)] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_24px_-8px_var(--accent)]';

/** Square icon-only secondary / ghost button. */
export const modalSecondaryIconBtnClass =
  'w-10 h-10 rounded-xl flex items-center justify-center transition-colors bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]';

/** Informational callout box. */
export const modalInfoClass =
  'text-xs p-4 rounded-xl flex gap-3 bg-[var(--accent)]/10 text-[var(--text-primary)]';

/** Segmented / option card (e.g. public vs private). */
export const modalOptionClass = (active: boolean) =>
  `flex-1 rounded-xl px-2 py-2.5 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all border ${
    active
      ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
      : 'border-[var(--border-color)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
  }`;

/** iOS-style toggle track. */
export const modalSwitchTrackClass = (active: boolean) =>
  `w-[44px] h-[24px] rounded-full p-1 transition-colors flex items-center ${
    active ? 'bg-[var(--accent)]' : 'bg-[var(--bg-tertiary)]'
  }`;

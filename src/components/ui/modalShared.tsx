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

export const modalOverlay = 'fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';

export const modalBackdrop = 'absolute inset-0 bg-black/60 backdrop-blur-sm';

export const modalSurface = (_isDark: boolean, maxWidth = 'max-w-[420px]') =>
  `glass-modal relative w-full ${maxWidth} max-h-[90vh] overflow-y-auto p-4 sm:p-6`;

export const modalCloseClass = (_isDark: boolean) =>
  `icon-button shrink-0 cursor-pointer`;

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

export const sheetOverlay = 'fixed inset-0 z-[var(--z-drawer)] flex items-end justify-center';
export const sheetOverlayAbsolute = 'absolute inset-0 z-[var(--z-dropdown)] flex items-end justify-center';
export const sheetBackdrop = 'absolute inset-0 bg-black/45 backdrop-blur-[2px]';
export const sheetSurface = (_isDark: boolean, extra = '') =>
  `glass-menu relative w-full max-w-md mx-auto rounded-t-2xl p-2 pb-[max(8px,env(safe-area-inset-bottom))] max-h-[80vh] overflow-y-auto ${extra}`;

export const sheetTitleClass = (_isDark: boolean) =>
  `px-4 py-2 text-xs font-semibold text-muted-foreground`;

export const sheetActionClass = (_isDark: boolean, danger = false, compact = false) =>
  `glass-menu-item w-full ${compact ? 'px-3 text-[length:var(--text-body-small)]' : 'px-4 text-[length:var(--text-button)]'} cursor-pointer ${danger ? 'danger' : ''}`;

export const sheetCancelClass = (_isDark: boolean, compact = false) =>
  `glass-menu-item w-full justify-center mt-1 mb-1 ${compact ? 'text-[length:var(--text-body-small)]' : 'font-bold text-[length:var(--text-button)]'} text-center cursor-pointer`;

/* ---- Shared modal content primitives (theme-token based, match Story composer look) ---- */

/** Small uppercase section label used above inputs / groups. */
export const modalLabelClass =
  'text-xs uppercase tracking-widest font-bold mb-2 opacity-50 text-[var(--text-primary)]';

/** Consistent text input / textarea field.
 *  Uses the design token control height (44px) with an explicit text size so
 *  the field never inherits an unexpectedly large font. */
export const modalFieldClass =
  'w-full h-[var(--control-height-lg)] rounded-xl px-4 outline-none transition-all border border-transparent shadow-[var(--inset-field-shadow)] focus:border-[var(--accent)] bg-[var(--bg-tertiary)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]';

/** Full-width primary action button (accent). */
export const modalPrimaryBtnClass =
  'w-full h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 bg-[var(--accent)] text-[var(--button-primary-text)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none shadow-[var(--shadow-btn-primary)]';

/** Secondary / ghost button. */
export const modalSecondaryBtnClass =
  'flex-1 h-11 text-sm font-bold rounded-xl transition-colors bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]';

/** Square icon-only primary action button (no w-full — safe inside sibling rows). */
export const modalPrimaryIconBtnClass =
  'w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-95 bg-[var(--accent)] text-[var(--button-primary-text)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none shadow-[var(--shadow-btn-primary)]';

/** Square icon-only secondary / ghost button. */
export const modalSecondaryIconBtnClass =
  'w-11 h-11 rounded-xl flex items-center justify-center transition-colors bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]';

/** Informational callout box. */
export const modalInfoClass =
  'text-xs p-4 rounded-xl flex gap-3 bg-[var(--accent)]/10 text-[var(--text-primary)]';

/** Segmented / option card (e.g. public vs private). */
export const modalOptionClass = (active: boolean) =>
  `flex-1 rounded-xl px-2 py-2.5 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all border ${
    active
      ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
      : 'border-[var(--border-color)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] shadow-[var(--inset-field-shadow)]'
  }`;

/** iOS-style toggle track. */
export const modalSwitchTrackClass = (active: boolean) =>
  `w-[44px] h-[24px] rounded-full p-1 transition-colors flex items-center ${
    active ? 'bg-[var(--accent)]' : 'bg-[var(--bg-tertiary)]'
  }`;

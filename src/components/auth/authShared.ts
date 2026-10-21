/**
 * Shared class strings for the auth screens (login + registration).
 *
 * The login and registration steps render the same error line, title,
 * subtitle, primary gradient button, link button and spinner; keeping the
 * strings here means a change to one of them lands on every step at once.
 *
 * Everything is expressed with design tokens so both themes resolve correctly.
 */

/** Inline validation / server error line above the form.
 *  The auth screens always sit on the dark gradient surface, so the error red
 *  stays the light-on-dark hue instead of the theme-dependent danger token. */
export const AUTH_ERROR_CLASS = 'text-xs text-red-400 mb-3 text-center';

/** Step heading (login + registration share the same ramp). */
export const AUTH_TITLE_CLASS = 'text-xl sm:text-2xl font-bold mb-2 text-center';

/** Step subtitle under the heading. */
export const AUTH_SUBTITLE_CLASS = 'text-sm text-[var(--text-secondary)] mb-6 text-center';

/** Primary gradient action button. */
export const AUTH_PRIMARY_BTN_CLASS =
  'w-full h-11 flex items-center justify-center gap-2.5 rounded-xl font-bold text-sm transition-transform active:scale-95 bg-gradient-to-r from-orange-600 to-amber-600 text-[var(--ink-on-saturate)] shadow-lg';

/** Primary gradient action button that reports a busy/disabled state. */
export const AUTH_PRIMARY_BTN_DISABLED_CLASS =
  `${AUTH_PRIMARY_BTN_CLASS} disabled:opacity-50 disabled:cursor-not-allowed`;

/** Ghost "skip / switch step" link button under the primary action. */
export const AUTH_LINK_BTN_CLASS =
  'w-full h-11 flex items-center justify-center gap-2 mt-3 rounded-xl font-medium text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors';

/** Centred loading spinner shown while a step is working — it matches the
 *  orange accent of the primary auth gradient, not the app accent. */
export const AUTH_SPINNER_CLASS =
  'w-9 h-9 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-6';

/** Centred single-column stack used by most steps. */
export const AUTH_COLUMN_CLASS = 'flex flex-col items-center text-center';

/** Multi-line phrase box on the login and registration steps. */
export const AUTH_TEXTAREA_CLASS =
  'w-full h-32 p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none';

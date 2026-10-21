/**
 * Small typographic combinations shared by cards, lists and rows.
 *
 * Class strings rather than components: every call site keeps its own element
 * (span / div) and only the text treatment is common.
 */

/** Secondary-colour caption that truncates instead of wrapping. */
export const SUBTLE_TRUNCATE_CLASS = 'text-xs text-[var(--text-secondary)] truncate';

/** Small uppercase caption used for action labels and role badges. */
export const CAPS_LABEL_CLASS = 'text-xs font-bold uppercase tracking-wider';

/** Secondary caption directly under a value inside a row or card. */
export const HINT_TEXT_CLASS = 'text-xs mt-1 text-[var(--text-secondary)]';

/** Same caption with a leading icon, laid out on one line. */
export const INLINE_HINT_CLASS = 'flex items-center gap-1.5 text-xs text-[var(--text-secondary)]';

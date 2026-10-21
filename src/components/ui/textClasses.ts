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

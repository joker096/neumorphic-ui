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

/** Compact label above a form control (profile edit fields). */
export const FIELD_LABEL_CLASS = 'text-xs font-semibold text-[var(--text-secondary)]';

/** Same caption with a leading icon, laid out on one line. */
export const INLINE_HINT_CLASS = 'flex items-center gap-1.5 text-xs text-[var(--text-secondary)]';

/** Semi-bold primary label used for row and menu titles. */
export const PRIMARY_LABEL_CLASS = 'text-sm font-semibold text-[var(--text-primary)]';

/** Medium-weight primary-colour text used for row titles and headings. */
export const MEDIUM_LABEL_CLASS = 'text-sm font-medium text-[var(--text-primary)]';

/** Large bold caption used for section headings and headline counters. */
export const LARGE_LABEL_CLASS = 'text-lg font-bold text-[var(--text-primary)]';

/** Secondary caption squeezed under a heading (counters, username). */
export const HINT_TEXT_TIGHT_CLASS = 'text-xs mt-0.5 text-[var(--text-secondary)]';

/** Bold heading of a step or a modal title. */
export const BOLD_LABEL_CLASS = 'text-sm font-bold text-[var(--text-primary)]';

/** Tiny bold label used by counters and filter captions. */
export const TINY_BOLD_CLASS = 'text-xs font-bold text-[var(--text-primary)]';

/** Small semibold caption with a leading icon, inline in a row. */
export const INLINE_SEMIBOLD_CLASS = 'inline-flex items-center gap-1 text-[var(--text-secondary)] text-xs font-semibold';

/** Bold name of a contact inside a list row. */
export const CONTACT_NAME_CLASS = 'font-bold text-sm text-[var(--text-primary)] break-words leading-snug';

/** Title of a sub-view header. */
export const SUBVIEW_TITLE_CLASS = 'font-sans text-xl font-bold tracking-wide text-[var(--text-primary)]';

/** Small accent caption above a comment or a thread. */
export const ACCENT_CAPS_CLASS = 'text-xs uppercase tracking-wider font-semibold text-[var(--accent)]';

/** Truncated semi-bold row title. */
export const SEMIBOLD_TRUNCATE_CLASS = 'text-sm font-semibold truncate text-[var(--text-primary)]';

/** Accent-coloured uppercase caption. */
export const ACCENT_CAPS_BOLD_CLASS = 'text-xs font-bold uppercase tracking-widest text-[var(--accent)]';

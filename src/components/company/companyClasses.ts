/**
 * Class strings shared by the company lists and their dialogs.
 *
 * These are class strings rather than components: every call site keeps its own
 * element (a spinner row, an empty-state column or an avatar circle) and only
 * the geometry and typography are genuinely identical.
 */

/** Row that centres a spinner while a list is loading. */
export const LIST_LOADING_CLASS =
  'flex items-center justify-center gap-2 py-8 text-[var(--text-secondary)]';

/** Column that centres the icon, title and hint of an empty list. */
export const LIST_EMPTY_CLASS =
  'flex flex-col items-center justify-center gap-3 py-8 text-center';

/** Single-line muted hint under an empty-state block. */
export const LIST_EMPTY_HINT_CLASS =
  'py-8 text-center text-xs text-[var(--text-secondary)]';

/** Round muted circle that wraps an avatar initial or icon in company dialogs. */
export const AVATAR_CIRCLE_CLASS =
  'min-w-11 min-h-11 rounded-full flex items-center justify-center shrink-0 bg-[var(--bg-tertiary)] text-[var(--text-secondary)]';

/** Multiline note field of the company contact and department dialogs. */
export const COMPANY_TEXTAREA_CLASS =
  'w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none border border-[var(--border-color)] focus:border-[var(--accent)] text-sm resize-none';

/** Selectable row of a company list. */
export const COMPANY_ROW_CLASS = 'w-full text-left p-3 rounded-2xl flex items-center gap-3 cursor-pointer transition-all bg-[var(--bg-tertiary)] hover:brightness-110';

/** Accent caption above a company list section. */
export const COMPANY_SECTION_LABEL_CLASS = 'flex items-center gap-2 px-2 mb-3 font-bold text-xs uppercase tracking-widest text-[var(--accent)]';

/** Inline text field of a company panel. */
export const COMPANY_INPUT_CLASS = 'flex-1 min-h-11 rounded-xl px-3 bg-[var(--input-bg)] text-[var(--text-primary)] outline-none';

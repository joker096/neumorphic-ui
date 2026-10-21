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

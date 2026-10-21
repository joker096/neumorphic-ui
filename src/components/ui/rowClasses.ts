/**
 * Shared shells for the settings-style rows and segmented controls.
 *
 * These are deliberately class strings rather than components: the rows differ
 * in colour, border and hover treatment from `ui/SettingsRow`, so only the
 * geometry they genuinely share lives here.
 */

/** Label-on-the-left / control-on-the-right row scaffold. */
export const ROW_SHELL_CLASS = 'flex items-center justify-between px-4 py-3';

/** Track that groups segmented buttons (theme, density, radius, animation). */
export const SEGMENTED_TRACK_CLASS =
  'flex rounded-lg border border-[var(--border-color)] overflow-hidden';

/** Bordered list row: stacked content with a checkbox or leading label. */
export const LIST_ROW_CLASS =
  'flex items-center gap-3 px-3 py-2 rounded-xl border border-[var(--border-color)]';

/** Header row of a card or sheet. */
export const SECTION_HEADER_ROW_CLASS = 'flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]';

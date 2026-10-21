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

/** Row inside a bordered group panel (members, permissions). */
export const GROUP_ROW_CLASS = 'flex items-center gap-3 px-4 py-3 border-b last:border-b-0 border-[var(--border-color)]';

/** Scrollable body of a comment or thread panel. */
export const SCROLL_BODY_CLASS = 'flex-1 overflow-y-auto p-4 flex flex-col gap-4';

/** Padded row: leading icon, label and trailing control. */
export const PADDED_ROW_CLASS =
  'flex items-center gap-3 px-4 py-3';

/** Compact label row above a group of fields. */
export const LABEL_ROW_CLASS =
  'flex items-center gap-2 mb-2';

/** Full width settings row used by the guide and support lists. */
export const GUIDE_ROW_CLASS = 'w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors active:scale-[0.99] hover:bg-black/5 dark:hover:bg-white/5';

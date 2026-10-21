/**
 * Class strings shared by the CRM surfaces.
 *
 * Class strings rather than components: every call site keeps its own button and
 * only the chrome of the control is identical.
 */

/** Square icon button used by the export menu and the CRM header. */
export const EXPORT_ICON_BTN_CLASS =
  'w-9 h-9 min-w-11 min-h-11 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all';

/** Scrollable body of a CRM board column (deals, people, tasks). */
export const CRM_PANEL_BODY_CLASS = 'flex-1 flex flex-col overflow-y-auto px-2 py-2';

/** Square primary button of the CRM boards (add deal / add task). */
export const CRM_ICON_PRIMARY_BTN_CLASS =
  'w-9 h-9 min-w-11 min-h-11 rounded-xl font-bold text-sm cursor-pointer transition-all bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:brightness-110 flex items-center justify-center';

/** Full width primary button of the CRM dialogs (save / submit). */
export const CRM_FULL_PRIMARY_BTN_CLASS =
  'w-full min-h-11 rounded-xl font-bold text-sm cursor-pointer transition-all bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:brightness-110 flex items-center justify-center gap-2';

/** Accent heading above a CRM board column. */
export const CRM_BOARD_TITLE_CLASS = 'flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--accent)]';

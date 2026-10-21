/**
 * Class strings shared by the CRM surfaces.
 *
 * Class strings rather than components: every call site keeps its own button and
 * only the chrome of the control is identical.
 */

/** Square icon button used by the export menu and the CRM header. */
export const EXPORT_ICON_BTN_CLASS =
  'w-9 h-9 min-w-11 min-h-11 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all';

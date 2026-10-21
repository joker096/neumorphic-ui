/**
 * Class strings shared by the security panels of the settings screen.
 *
 * Class strings rather than components: every panel keeps its own footer
 * element and only the chrome of that footer is identical.
 */

/** Footer bar that separates a panel's body from its action row. */
export const PANEL_FOOTER_CLASS = 'px-4 py-3 border-t border-[var(--border-color)] dark:border-[var(--border-color)]';

/** Half-width segment of the two-column choice inside a security panel. */
export const SEGMENTED_BTN_CLASS = 'flex-1 py-2 rounded-lg text-xs font-medium transition-colors bg-black/5 text-[var(--text-secondary)] hover:bg-black/10 dark:bg-white/10 dark:text-[var(--text-primary)] dark:hover:bg-white/20';

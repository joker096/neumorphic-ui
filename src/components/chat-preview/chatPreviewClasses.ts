/**
 * Class strings shared by the chat preview surfaces.
 *
 * Class strings rather than components: every call site keeps its own element
 * and only the chrome of the control is identical.
 */

/** Red unread counter badge pinned to a corner of a header button. */
export const UNREAD_BADGE_CLASS = 'absolute -top-1 -right-1 min-w-[20px] h-[20px] bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-[var(--ink-on-saturate)] shadow-md border-[2px] border-[var(--bg-secondary)] dark:border-[var(--bg-primary)] px-1';

/** Accent caption above a message bubble. */
export const MESSAGE_SENDER_LABEL_CLASS = 'mb-1 text-xs font-semibold leading-tight text-[var(--accent)]';

/** Anchored context-menu surface. */
export const CONTEXT_MENU_CLASS = 'z-[var(--z-tooltip)] glass-menu rounded-xl p-1 animate-fade-in';

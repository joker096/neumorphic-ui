export const DEFAULT_CHANNEL_GRADIENT = 'from-blue-500 to-indigo-500';

export const CURRENT_USER_SENDER = 'me';

export interface ChannelComment {
  id: number;
  sender: string;
  text: string;
  time: string;
  postId?: number;
}

/**
 * Channel comment bubbles and meta text.
 *
 * These were theme pairs (dark/light) until round 24 — every pair resolved to
 * the same design token once the light theme stopped hardcoding `bg-white`,
 * so the exported surface is now a single token-based value per role.
 */
export const COMMENT_OUTGOING_BG =
  'bg-[var(--accent-soft)] border border-[var(--accent)]/40 text-[var(--text-primary)]';
export const COMMENT_INCOMING_BG =
  'bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)]';

export const COMMENT_SENDER_NAME_CLASS = 'text-[var(--accent)]';
export const COMMENT_TIME_CLASS = 'text-[var(--text-secondary)]';
export const COMMENT_EMPTY_ICON_CLASS = 'text-[var(--text-tertiary)]';
export const COMMENT_EMPTY_TEXT_CLASS = 'text-[var(--text-secondary)]';

export const getCommentBubbleClass = (isOwn: boolean): string => {
  const align = isOwn ? 'self-end rounded-br-sm' : 'self-start rounded-bl-sm';
  return `${align} ${isOwn ? COMMENT_OUTGOING_BG : COMMENT_INCOMING_BG}`;
};

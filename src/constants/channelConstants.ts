import type { P2PChannel } from '../store/types';

export const CHANNEL_MIN_NAME_LENGTH = 1;

export const DEFAULT_CHANNEL_GRADIENT = 'from-blue-500 to-indigo-500';

export const DEFAULT_CHANNEL_SETTINGS: NonNullable<P2PChannel['settings']> = {
  canPost: false,
  canComment: true,
  commentsRequireApproval: false,
  canReact: true,
  allowDownloads: true,
  pinMessages: true,
  showSubscribers: true,
  allowForwarding: false,
  allowReactions: true,
  allowComments: true,
  allowEditing: false,
  allowDeletion: true,
};

export const CURRENT_USER_SENDER = 'me';

export interface ChannelComment {
  id: number;
  sender: string;
  text: string;
  time: string;
  postId?: number;
}

export const EMPTY_COMMENTS_STATE_TEXT = 'leaveAComment';

export const SEED_CHANNEL_COMMENTS: ChannelComment[] = [
  { id: 1, sender: 'Alice Freeman', text: "Wow, that's amazing! 🔥", time: '10:45' },
  { id: 2, sender: 'Charlie', text: "Can't wait to test this out later today.", time: '10:49' },
];

export const COMMENT_OUTGOING_LIGHT_GRADIENT = 'bg-gradient-to-br from-orange-400 to-orange-500';
export const COMMENT_OUTGOING_DARK_BG = 'bg-orange-600/20 border border-orange-500/30';
export const COMMENT_INCOMING_DARK_BG = 'bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)]';
export const COMMENT_INCOMING_LIGHT_BG = 'bg-white border border-[var(--border-color)] text-slate-700 shadow-sm';

export const COMMENT_SENDER_NAME_CLASS_DARK = 'text-orange-400';
export const COMMENT_SENDER_NAME_CLASS_LIGHT = 'text-orange-200';

export const COMMENT_TIME_OWN_DARK = 'text-orange-200/50';
export const COMMENT_TIME_OWN_LIGHT = 'text-[var(--text-primary)]/70';
export const COMMENT_TIME_OTHER_DARK = 'text-gray-500';
export const COMMENT_TIME_OTHER_LIGHT = 'text-slate-400';

export const COMMENT_EMPTY_ICON_CLASS_DARK = 'text-gray-600';
export const COMMENT_EMPTY_ICON_CLASS_LIGHT = 'text-slate-300';
export const COMMENT_EMPTY_TEXT_CLASS_DARK = 'text-gray-400';
export const COMMENT_EMPTY_TEXT_CLASS_LIGHT = 'text-slate-500';

export const CHANNEL_CREATE_GRADIENT = 'bg-gradient-to-tr from-orange-500 to-orange-400';

export const getCommentBubbleClass = (isDark: boolean, isOwn: boolean): string => {
  const align = isOwn ? 'self-end rounded-br-sm' : 'self-start rounded-bl-sm';
  if (isOwn) {
    return isDark
      ? `${align} ${COMMENT_OUTGOING_DARK_BG} text-[var(--text-primary)]`
      : `${align} ${COMMENT_OUTGOING_LIGHT_GRADIENT} text-[var(--text-primary)] shadow-md`;
  }
  return isDark
    ? `${align} ${COMMENT_INCOMING_DARK_BG}`
    : `${align} ${COMMENT_INCOMING_LIGHT_BG}`;
};

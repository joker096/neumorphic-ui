import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Send, MessageSquare } from 'lucide-react';
import { FormattedText } from './chat-preview/FormattedText';
import { messageEncryption } from '../lib/crypto/MessageEncryptionService';
import { p2pNetwork } from '../lib/p2p/network';
import { useI18n } from '../lib/i18n';
import {
  CURRENT_USER_SENDER,
  SEED_CHANNEL_COMMENTS,
  getCommentBubbleClass,
  COMMENT_SENDER_NAME_CLASS_DARK,
  COMMENT_SENDER_NAME_CLASS_LIGHT,
  COMMENT_TIME_OWN_DARK,
  COMMENT_TIME_OWN_LIGHT,
  COMMENT_TIME_OTHER_DARK,
  COMMENT_TIME_OTHER_LIGHT,
  COMMENT_EMPTY_ICON_CLASS_DARK,
  COMMENT_EMPTY_ICON_CLASS_LIGHT,
  COMMENT_EMPTY_TEXT_CLASS_DARK,
  COMMENT_EMPTY_TEXT_CLASS_LIGHT,
  type ChannelComment,
} from '../constants/channelConstants';

interface ChannelCommentsProps {
  isOpen: boolean;
  onClose: () => void;
  postId: number;
  postKey: string;
  theme?: 'dark' | 'light';
  channelChatId: string;
}

const formatCurrentTime = (): string =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const CommentBubble = ({
  comment,
  isDark,
}: {
  comment: ChannelComment;
  isDark: boolean;
}) => {
  const own = comment.sender === CURRENT_USER_SENDER;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      key={comment.id}
      className={`flex flex-col gap-1 p-3 rounded-2xl max-w-[85%] ${getCommentBubbleClass(isDark, own)}`}
    >
      {!own && (
        <span className={`text-[11px] font-bold mb-1 ${isDark ? COMMENT_SENDER_NAME_CLASS_DARK : COMMENT_SENDER_NAME_CLASS_LIGHT}`}>
          {comment.sender}
        </span>
      )}
      <p className="text-[14px] leading-relaxed break-words">
        <FormattedText text={comment.text} />
      </p>
      <span
        className={`text-[10px] self-end mt-1 ${
          own
            ? isDark
              ? COMMENT_TIME_OWN_DARK
              : COMMENT_TIME_OWN_LIGHT
            : isDark
              ? COMMENT_TIME_OTHER_DARK
              : COMMENT_TIME_OTHER_LIGHT
        }`}
      >
        {comment.time}
      </span>
    </motion.div>
  );
};

const EmptyCommentsState = ({ isDark }: { isDark: boolean }) => {
  const { t } = useI18n();

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center gap-3 px-6 py-12">
      <MessageSquare size={40} className={isDark ? COMMENT_EMPTY_ICON_CLASS_DARK : COMMENT_EMPTY_ICON_CLASS_LIGHT} />
      <p className={`text-[14px] ${isDark ? COMMENT_EMPTY_TEXT_CLASS_DARK : COMMENT_EMPTY_TEXT_CLASS_LIGHT}`}>
        {t('channelComments.leaveAComment')}
      </p>
    </div>
  );
};

export const ChannelCommentsView = ({
  isOpen,
  onClose,
  postId,
  postKey,
  theme = 'dark',
  channelChatId,
}: ChannelCommentsProps) => {
  const isDark = theme === 'dark';
  const { t } = useI18n();
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<ChannelComment[]>(SEED_CHANNEL_COMMENTS);
  const commentIdRef = useRef(0);

  const handleSend = async () => {
    const text = comment.trim();
    if (!text) return;

    const newId = Date.now() + commentIdRef.current++;

    try {
      const encryptedComment = await messageEncryption.encrypt(
        channelChatId,
        JSON.stringify({
          id: newId,
          sender: CURRENT_USER_SENDER,
          text,
          postId,
          type: 'comment',
        }),
      );

      await p2pNetwork.broadcast(
        JSON.stringify({ ...encryptedComment, chatId: channelChatId, postId }),
      );
    } catch {
      // Offline / encryption failure: still surface locally for feedback.
    }

    setComments((prev) => [
      ...prev,
      { id: newId, sender: CURRENT_USER_SENDER, text, time: formatCurrentTime(), postId },
    ]);
    setComment('');
  };

  const hasComments = comments.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={`absolute inset-0 z-50 flex flex-col ${isDark ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-secondary)]'}`}
        >
          <div
            className={`h-[72px] flex items-center px-4 border-b ${isDark ? 'border-[var(--border-color)] bg-[var(--bg-tertiary)]' : 'border-[var(--border-color)] bg-white'}`}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close', 'Close')}
              className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center cursor-pointer transition-colors mr-3 ${isDark ? 'hover:bg-[var(--bg-tertiary)]/20 text-[var(--text-secondary)]' : 'hover:bg-black/5 text-[var(--text-secondary)]'}`}
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h3 className="font-bold text-[15px] text-[var(--text-primary)]">
                {t('channelComments.title')}
              </h3>
              <p
                className={`text-[11px] uppercase tracking-wider font-semibold ${isDark ? 'text-orange-500' : 'text-orange-600'}`}
              >
                {t('channelComments.replies', { count: comments.length })}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {hasComments ? (
              comments.map((c) => <CommentBubble key={c.id} comment={c} isDark={isDark} />)
            ) : (
              <EmptyCommentsState isDark={isDark} />
            )}
          </div>

          <div
            className={`p-4 border-t ${isDark ? 'border-[var(--border-color)] bg-[color:var(--bg-tertiary)]/90 backdrop-blur-md' : 'border-[var(--border-color)] bg-[var(--bg-primary)]/90 backdrop-blur-md'}`}
          >
            <div
              className={`flex items-center w-full h-12 rounded-full px-4 relative ${isDark ? 'bg-[var(--bg-secondary)] border border-[var(--border-color)]' : 'bg-white border border-[var(--border-color)] shadow-[inset_1px_1px_3px_rgba(165,175,190,0.1)]'}`}
            >
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={t('channelComments.placeholder')}
                className={`flex-1 bg-transparent border-none outline-none text-[14px] ${isDark ? 'text-[var(--text-primary)] placeholder:text-gray-500' : 'text-slate-700 placeholder:text-slate-400'}`}
              />
              <button
                type="button"
                onClick={handleSend}
                aria-label={t('channelComments.send', 'Send')}
                className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full ml-2 cursor-pointer transition-transform active:scale-95 ${
                  comment.trim()
                    ? isDark
                      ? 'bg-[var(--color-warning)] text-[var(--text-primary)]'
                      : 'bg-orange-400 text-[var(--text-primary)] shadow-md'
                    : isDark
                      ? 'bg-[var(--bg-tertiary)]/10 text-gray-500'
                      : 'bg-black/5 text-slate-400'
                }`}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

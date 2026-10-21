import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Send, MessageSquare } from 'lucide-react';
import { FormattedText } from './chat-preview/FormattedText';
import { useI18n } from '../lib/i18n';
import { get, set } from '../lib/idb';
import { formatClockTime } from '../utils/chatUtils';
import { FORM_TRANSPARENT_INPUT_CLASS } from './ui/formClasses';
import { ACCENT_CAPS_CLASS, BOLD_BASE_CLASS } from './ui/textClasses';
import { SCROLL_BODY_CLASS } from './ui/rowClasses';
import {
  CURRENT_USER_SENDER,
  getCommentBubbleClass,
  COMMENT_SENDER_NAME_CLASS,
  COMMENT_TIME_CLASS,
  COMMENT_EMPTY_ICON_CLASS,
  COMMENT_EMPTY_TEXT_CLASS,
  type ChannelComment,
} from '../constants/channelConstants';

interface ChannelCommentsProps {
  isOpen: boolean;
  onClose: () => void;
  postId: number;
}

const formatCurrentTime = (): string => formatClockTime(Date.now());

const CommentBubble = ({ comment }: { comment: ChannelComment }) => {
  const own = comment.sender === CURRENT_USER_SENDER;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      key={comment.id}
      className={`flex flex-col gap-1 p-3 rounded-2xl max-w-[85%] ${getCommentBubbleClass(own)}`}
    >
      {!own && (
        <span className={`text-xs font-bold mb-1 ${COMMENT_SENDER_NAME_CLASS}`}>
          {comment.sender}
        </span>
      )}
      <p className="text-sm leading-relaxed break-words">
        <FormattedText text={comment.text} />
      </p>
      <span className={`text-xs self-end mt-1 ${COMMENT_TIME_CLASS}`}>
        {comment.time}
      </span>
    </motion.div>
  );
};

const EmptyCommentsState = () => {
  const { t } = useI18n();

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center gap-3 px-6 py-12">
      <MessageSquare size={40} className={COMMENT_EMPTY_ICON_CLASS} />
      <p className={`text-sm ${COMMENT_EMPTY_TEXT_CLASS}`}>
        {t('channelComments.leaveAComment')}
      </p>
    </div>
  );
};

export const ChannelCommentsView = ({
  isOpen,
  onClose,
  postId,
}: ChannelCommentsProps) => {
  const { t } = useI18n();
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<ChannelComment[]>([]);
  const commentIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    void get<ChannelComment[]>(`channel_comments_${postId}`).then((stored) => {
      if (!cancelled) setComments(stored ?? []);
    });
    return () => { cancelled = true; };
  }, [postId]);

  const handleSend = () => {
    const text = comment.trim();
    if (!text) return;

    const newId = Date.now() + commentIdRef.current++;
    const next: ChannelComment[] = [
      ...comments,
      { id: newId, sender: CURRENT_USER_SENDER, text, time: formatCurrentTime(), postId },
    ];
    setComments(next);
    void set(`channel_comments_${postId}`, next);
    setComment('');
  };

  const hasComments = comments.length > 0;
  const canSend = comment.trim().length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute inset-0 z-50 flex flex-col bg-[var(--bg-primary)]"
        >
          <div className="h-[72px] flex items-center px-4 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close', 'Close')}
              className="w-9 h-9 min-w-11 min-h-11 rounded-full flex items-center justify-center cursor-pointer transition-colors mr-3 text-[var(--text-secondary)] hover:bg-[var(--msg-bg-panel-hover)] active:scale-95"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h3 className={BOLD_BASE_CLASS}>
                {t('channelComments.title')}
              </h3>
              <p className={ACCENT_CAPS_CLASS}>
                {t('channelComments.replies', { count: comments.length })}
              </p>
            </div>
          </div>

          <div className={SCROLL_BODY_CLASS}>
            {hasComments ? (
              comments.map((c) => <CommentBubble key={c.id} comment={c} />)
            ) : (
              <EmptyCommentsState />
            )}
          </div>

          <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-tertiary)]/90 backdrop-blur-md">
            <div className="flex items-center w-full h-12 rounded-full px-4 relative bg-[var(--bg-secondary)] border border-[var(--border-color)]">
              <input
                aria-label={t('channelComments.placeholder')}
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={t('channelComments.placeholder')}
                className={FORM_TRANSPARENT_INPUT_CLASS}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!canSend}
                aria-label={t('channelComments.send', 'Send')}
                className={`min-w-11 min-h-11 flex items-center justify-center rounded-full ml-2 cursor-pointer transition-all active:scale-95 ${
                  canSend
                    ? 'bg-[var(--accent)] text-[var(--ink-on-saturate)]'
                    : 'bg-[var(--msg-bg-input)] text-[var(--text-tertiary)] cursor-default active:scale-100'
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

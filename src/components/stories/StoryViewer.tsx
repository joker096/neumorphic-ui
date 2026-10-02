import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { useBodyScrollLock } from '../../lib/a11y';
import { StoryProgressBar } from './StoryProgressBar';
import { StoryHeader } from './StoryHeader';
import { StoryContent } from './StoryContent';
import { StoryFooter } from './StoryFooter';
import { StoryOptionsMenu } from './StoryOptionsMenu';
import { StoryShareMenu } from './StoryShareMenu';
import { ChatPickerModal } from '../payments/ChatPickerModal';
import { useStoryViewer } from './useStoryViewer';

interface StoryViewerProps {
  activeUser: { id: number | string; name: string; color: string } | null;
  onClose: () => void;
  isDark?: boolean;
  isStealthMode?: boolean;
}

export const StoryViewer = ({ activeUser, onClose, isStealthMode = false }: StoryViewerProps) => {
  useBodyScrollLock(true);
  const { t } = useI18n();
  const {
    user, stories, story, storyIndex, progress, reply, liked,
    menuOpen, shareOpen, forwardPicker, savable, timeLabel,
    setReply, setPaused, setMenuOpen, setShareOpen, setForwardPicker,
    goNext, goPrev, onTap, sendReply, toggleLike,
    copyLink, handleShare, handleForward, handleDelete, handleSave,
  } = useStoryViewer({ activeUser, onClose });

  if (!activeUser) return null;

  if (!story) {
    return createPortal(
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/95"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md h-full max-h-[90vh] flex flex-col items-center justify-center gap-3 text-white/80 px-6 text-center">
            <p className="text-lg font-medium">{t('story.noStories', 'No stories to show')}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 min-h-[var(--control-height-md)]"
            >
              {t('common.close')}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>,
      document.body
    );
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/95"
        role="dialog"
        aria-modal="true"
        aria-label={user.name}
      >
        <div className="relative w-full max-w-md h-full max-h-[90vh] flex flex-col">
          <StoryProgressBar count={stories.length} currentIndex={storyIndex} progress={progress} />

          <StoryHeader user={user} timeLabel={timeLabel} onClose={onClose} />

          <StoryContent
            story={story}
            isStealthMode={isStealthMode}
            onTap={onTap}
            onPauseStart={() => setPaused(true)}
            onPauseEnd={() => setPaused(false)}
            onSwipeNext={goNext}
            onSwipePrev={goPrev}
            onSwipeClose={onClose}
          />

          <StoryFooter
            user={user}
            reply={reply}
            liked={liked}
            onReplyChange={setReply}
            onSendReply={sendReply}
            onToggleLike={toggleLike}
            onShare={handleShare}
            onOpenMenu={() => setMenuOpen(true)}
          />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            aria-label={t('common.back')}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 min-w-11 min-h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-white/70 opacity-0 md:opacity-100"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
        </div>

        <StoryOptionsMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          isMe={!!user.isMe}
          savable={savable}
          onCopyLink={copyLink}
          onDelete={handleDelete}
          onSave={handleSave}
        />

        <StoryShareMenu
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          onForward={() => {
            setShareOpen(false);
            setForwardPicker(true);
          }}
          onCopyLink={() => {
            setShareOpen(false);
            copyLink();
          }}
        />

        <ChatPickerModal
          open={forwardPicker}
          onClose={() => setForwardPicker(false)}
          onPick={handleForward}
          title={t('story.forwardToChat', 'Forward')}
        />
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

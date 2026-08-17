import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { toast } from '../ui/Toast';
import { STORY_DURATION_MS, STORY_PROGRESS_TICK_MS, STORY_SHARE_PATH, STORY_MINUTES_DIVISOR } from '../../constants/storyConstants';
import { STORY_USERS, MY_STORY_USER, type StoryUser } from './storiesData';
import { StoryProgressBar } from './StoryProgressBar';
import { StoryHeader } from './StoryHeader';
import { StoryContent } from './StoryContent';
import { StoryFooter } from './StoryFooter';
import { StoryOptionsMenu } from './StoryOptionsMenu';

interface StoryViewerProps {
  activeUser: { id: number | string; name: string; color: string } | null;
  onClose: () => void;
  isDark?: boolean;
  isStealthMode?: boolean;
}

const PROGRESS_INCREMENT = 100 / (STORY_DURATION_MS / STORY_PROGRESS_TICK_MS);

export const StoryViewer = ({ activeUser, onClose, isStealthMode = false }: StoryViewerProps) => {
  const { t } = useI18n();
  const allUsers: StoryUser[] = [MY_STORY_USER, ...STORY_USERS];

  const initialIndex = Math.max(0, allUsers.findIndex((u) => u.id === (activeUser?.id ?? -1)));
  const [userIndex, setUserIndex] = useState(initialIndex === -1 ? 0 : initialIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reply, setReply] = useState('');
  const [liked, setLiked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const timerRef = useRef<number | null>(null);

  const user = allUsers[userIndex] ?? MY_STORY_USER;
  const story = user.stories[storyIndex] ?? user.stories[0];

  const shareUrl = story ? STORY_SHARE_PATH(user.id, story.id) : '';

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast(t('story.linkCopied', 'Link copied'), 'success');
    } catch {
      toast(t('story.linkCopied', 'Link copied'), 'info');
    }
  };

  const handleShare = async () => {
    if (!story || !shareUrl) return;
    const shareData = {
      title: user.name,
      text: t('story.shareText', 'Check out this story'),
      url: shareUrl,
    };
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        return;
      }
    }
    await copyLink();
  };

  const handleDelete = () => {
    const target = allUsers[userIndex];
    if (!target) return;
    const idx = target.stories.findIndex((s) => s.id === story?.id);
    if (idx >= 0) target.stories.splice(idx, 1);
    if (target.stories.length === 0) {
      if (allUsers.length > 1) {
        const next = userIndex < allUsers.length - 1 ? userIndex : userIndex - 1;
        resetStory(next, 0);
      } else {
        onClose();
        return;
      }
    } else {
      resetStory(userIndex, Math.min(storyIndex, target.stories.length - 1));
    }
    toast(t('story.storyDeleted', 'Story deleted'), 'success');
  };

  const resetStory = useCallback((u: number, s: number) => {
    setUserIndex(u);
    setStoryIndex(s);
    setProgress(0);
    setReply('');
    setLiked(false);
  }, []);

  const goNext = useCallback(() => {
    if (storyIndex < user.stories.length - 1) {
      resetStory(userIndex, storyIndex + 1);
    } else if (userIndex < allUsers.length - 1) {
      resetStory(userIndex + 1, 0);
    } else {
      onClose();
    }
  }, [storyIndex, userIndex, user.stories.length, allUsers.length, resetStory, onClose]);

  const goPrev = useCallback(() => {
    if (storyIndex > 0) {
      resetStory(userIndex, storyIndex - 1);
    } else if (userIndex > 0) {
      const prev = allUsers[userIndex - 1];
      resetStory(userIndex - 1, prev.stories.length - 1);
    } else {
      setProgress(0);
    }
  }, [storyIndex, userIndex, resetStory, allUsers]);

  useEffect(() => {
    if (paused) return;
    timerRef.current = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          goNext();
          return 0;
        }
        return p + PROGRESS_INCREMENT;
      });
    }, STORY_PROGRESS_TICK_MS);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [paused, goNext]);

  if (!activeUser) return null;

  const onTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.33) goPrev();
    else goNext();
  };

  const sendReply = () => {
    if (!reply.trim()) return;
    toast(t('story.replySent', 'Reply sent'), 'success');
    setReply('');
  };

  const toggleLike = () => setLiked((v) => !v);

  const timeLabel = user.isMe
    ? t('story.yourStory', 'Your story')
    : story
      ? `${Math.max(1, Math.round((Date.now() - story.time) / STORY_MINUTES_DIVISOR))}m`
      : '';

  if (!story) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95"
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
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95"
        role="dialog"
        aria-modal="true"
        aria-label={user.name}
      >
        <div className="relative w-full max-w-md h-full max-h-[90vh] flex flex-col">
          <StoryProgressBar count={user.stories.length} currentIndex={storyIndex} progress={progress} />

          <StoryHeader user={user} timeLabel={timeLabel} onClose={onClose} />

          <StoryContent
            story={story}
            isStealthMode={isStealthMode}
            onTap={onTap}
            onPauseStart={() => setPaused(true)}
            onPauseEnd={() => setPaused(false)}
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
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-white/70 opacity-0 md:opacity-100"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
        </div>

        <StoryOptionsMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          isMe={!!user.isMe}
          onCopyLink={copyLink}
          onDelete={handleDelete}
        />
      </motion.div>
    </AnimatePresence>
  );
};

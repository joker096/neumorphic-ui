import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { toast } from '../ui/Toast';
import { useI18n } from '../../lib/i18n';
import { STORY_DURATION_MS, STORY_PROGRESS_TICK_MS, STORY_MINUTES_DIVISOR } from '../../constants/storyConstants';
import { storyShareLink } from '../../config/app';
import { STORY_USERS, MY_STORY_USER, getVisibleStories, deleteMyStory, type StoryUser } from './storiesData';
import { markStoriesSeen } from '../../lib/stories/storySeen';
import { saveStoryMedia, storyFileName } from '../../lib/stories/storySave';
import { useAppStore } from '../../store';

interface StoryViewerInput {
  activeUser: { id: number | string; name: string; color: string } | null;
  onClose: () => void;
}

const PROGRESS_INCREMENT = 100 / (STORY_DURATION_MS / STORY_PROGRESS_TICK_MS);

export function useStoryViewer({ activeUser, onClose }: StoryViewerInput) {
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
  const [shareOpen, setShareOpen] = useState(false);
  const [forwardPicker, setForwardPicker] = useState(false);
  const timerRef = useRef<number | null>(null);
  const prevUserIdRef = useRef<number | string | undefined>(undefined);

  const user = allUsers[userIndex] ?? MY_STORY_USER;
  const stories = getVisibleStories(user);
  const story = stories[storyIndex] ?? stories[0];

  const shareUrl = story ? storyShareLink(user.id, story.id) : '';
  const savable = !!story?.image || !!story?.video;

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast(t('story.linkCopied', 'Link copied'), 'success');
    } catch {
      toast(t('story.linkCopied', 'Link copied'), 'info');
    }
  };

  const handleShare = () => {
    if (!story) return;
    setShareOpen(true);
  };

  const buildStoryMessage = () => ({
    id: Date.now(),
    type: 'story' as const,
    sender: 'me' as const,
    time: Date.now(),
    status: 'sent' as const,
    text: story?.caption ?? '',
    story: {
      userId: user.id,
      userName: user.name,
      userColor: user.color,
      storyId: story?.id,
      type: story?.type,
      bg: story?.bg,
      image: story?.image,
      video: story?.video,
      caption: story?.caption,
    },
  });

  const handleForward = (chat: any) => {
    if (!story) return;
    useAppStore.getState().forwardMessage(buildStoryMessage(), String(chat.id));
    setForwardPicker(false);
    toast(t('story.forwarded', 'Story shared'), 'success');
  };

  const handleDelete = () => {
    if (!story) return;
    deleteMyStory(story.id);
    const target = allUsers[userIndex];
    const remaining = target ? getVisibleStories(target) : [];
    if (remaining.length === 0) {
      let next = -1;
      for (let i = 1; i < allUsers.length; i++) {
        const idx = (userIndex + i) % allUsers.length;
        if (getVisibleStories(allUsers[idx]).length > 0) {
          next = idx;
          break;
        }
      }
      if (next === -1) {
        onClose();
        return;
      }
      resetStory(next, 0);
    } else {
      resetStory(userIndex, Math.min(storyIndex, remaining.length - 1));
    }
    toast(t('story.storyDeleted', 'Story deleted'), 'success');
  };

  const handleSave = () => {
    if (!story) return;
    const url = story.image || story.video;
    void saveStoryMedia(url, storyFileName(user.name, story.id)).then((ok) => {
      toast(ok ? t('story.storySaved', 'Story saved') : t('story.saveFailed', 'Could not save story'), ok ? 'success' : 'error');
    });
  };

  const resetStory = useCallback((u: number, s: number) => {
    setUserIndex(u);
    setStoryIndex(s);
    setProgress(0);
    setReply('');
    setLiked(false);
  }, []);

  useEffect(() => {
    const id = activeUser?.id;
    if (id === undefined || id === prevUserIdRef.current) return;
    prevUserIdRef.current = id;
    const idx = [MY_STORY_USER, ...STORY_USERS].findIndex((u) => u.id === id);
    resetStory(idx === -1 ? 0 : idx, 0);
  }, [activeUser?.id, resetStory]);

  const activeId = activeUser?.id;

  useEffect(() => {
    if (activeId === undefined) return;
    const target = [MY_STORY_USER, ...STORY_USERS].find((u) => u.id === activeId);
    if (target) markStoriesSeen(target);
  }, [activeId]);

  const goNext = useCallback(() => {
    if (storyIndex < stories.length - 1) {
      resetStory(userIndex, storyIndex + 1);
    } else if (userIndex < allUsers.length - 1) {
      resetStory(userIndex + 1, 0);
    } else {
      onClose();
    }
  }, [storyIndex, userIndex, stories.length, allUsers.length, resetStory, onClose]);

  const goPrev = useCallback(() => {
    if (storyIndex > 0) {
      resetStory(userIndex, storyIndex - 1);
    } else if (userIndex > 0) {
      const prev = allUsers[userIndex - 1];
      resetStory(userIndex - 1, getVisibleStories(prev).length - 1);
    } else {
      setProgress(0);
    }
  }, [storyIndex, userIndex, resetStory, allUsers]);

  useEffect(() => {
    if (activeId === undefined) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeId, onClose, goNext, goPrev]);

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


  const onTap = (e: MouseEvent<HTMLDivElement>) => {
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

  return {
    user, stories, story, storyIndex, progress, reply, liked,
    menuOpen, shareOpen, forwardPicker, savable, timeLabel,
    setReply, setPaused, setMenuOpen, setShareOpen, setForwardPicker,
    goNext, goPrev, onTap, sendReply, toggleLike,
    copyLink, handleShare, handleForward, handleDelete, handleSave,
  };
}

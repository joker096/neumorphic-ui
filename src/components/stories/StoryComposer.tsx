import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { Image as ImageIcon, Send, X } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { CloseButton } from '../ui/CloseButton';
import { Button } from '../ui/Button';
import { toast } from '../ui/Toast';
import { STORY_CAPTION_MAX_LENGTH } from '../../constants/storyConstants';
import { useStoriesStore } from '../../features/stories/storiesStore';
import { STORY_MEDIA_COVER_CLASS } from './storyClasses';
import { SECTION_HEADER_ROW_CLASS } from '../ui/rowClasses';

interface StoryComposerProps {
  open: boolean;
  onClose: () => void;
}

interface MediaState {
  kind: 'image' | 'video';
  url: string;
}

export const StoryComposer = ({ open, onClose }: StoryComposerProps) => {
  const { t } = useI18n();
  const [caption, setCaption] = useState('');
  const [media, setMedia] = useState<MediaState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset draft state each time the composer is opened.
  useEffect(() => {
    if (open) {
      setCaption('');
      setMedia(null);
    }
  }, [open]);

  if (!open) return null;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.type.startsWith('video/')) {
      setMedia({ kind: 'video', url: URL.createObjectURL(file) });
    } else if (file.type.startsWith('image/')) {
      setMedia({ kind: 'image', url: URL.createObjectURL(file) });
    } else {
      toast(t('story.unsupportedMedia', 'Unsupported file type'), 'error');
    }
  };

  const removeMedia = () => {
    if (media) URL.revokeObjectURL(media.url);
    setMedia(null);
  };

  const publish = () => {
    if (!media) return;
    void useStoriesStore.getState().publishMyStory({
      media: { kind: media.kind, src: media.url },
      caption: caption.trim(),
    });
    toast(t('story.published', 'Story published'), 'success');
    onClose();
  };

  const surfaceClass = 'bg-[var(--bg-secondary)] border border-[var(--border-color)]';
  const labelClass = 'text-xs uppercase tracking-widest font-bold mb-2 opacity-50 text-[var(--text-primary)]';

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[var(--z-modal-nested)] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('story.composer', 'New story')}
    >
      <div className={`w-full max-w-md rounded-2xl overflow-hidden shadow-2xl ${surfaceClass}`}>
        <div className={SECTION_HEADER_ROW_CLASS}>
          <h3 className="font-semibold text-[var(--text-primary)]">{t('story.newStory', 'New story')}</h3>
          <CloseButton onClick={onClose} aria-label={t('common.close')} size="md" />
        </div>

        <div className="p-4">
          <div className="relative rounded-xl h-56 flex items-center justify-center overflow-hidden bg-black/40">
            {media?.kind === 'image' && (
              <img src={media.url} alt="" className={STORY_MEDIA_COVER_CLASS} />
            )}
            {media?.kind === 'video' && (
              <video src={media.url} className={STORY_MEDIA_COVER_CLASS} autoPlay muted loop playsInline />
            )}
            {!media && <ImageIcon size={32} className="text-white/70" aria-hidden="true" />}
            {media && (
              <button
                type="button"
                onClick={removeMedia}
                aria-label={t('story.removeMedia', 'Remove media')}
                className="absolute top-2 right-2 z-20 flex items-center justify-center w-9 h-9 min-w-11 min-h-11 rounded-full bg-black/55 text-white cursor-pointer transition-colors hover:bg-black/75"
              >
                <X size={16} aria-hidden="true" />
              </button>
            )}
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={t('story.captionPlaceholder', 'Add a caption…')}
              aria-label={t('story.captionPlaceholder', 'Add a caption…')}
              maxLength={STORY_CAPTION_MAX_LENGTH}
              className="absolute inset-0 w-full h-full bg-transparent text-white text-center font-medium p-6 resize-none outline-none placeholder-white/70"
            />
            <span className="absolute bottom-2 right-3 z-20 text-xs text-white/60 bg-black/35 rounded-full px-2 py-0.5" aria-label={t('story.characters')}>
              {caption.length}/{STORY_CAPTION_MAX_LENGTH}
            </span>
          </div>

          <div className="mt-4">
            <div className={labelClass}>{t('story.media', 'Media')}</div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={Boolean(media)}
              className="w-full min-h-11 rounded-xl flex items-center justify-center gap-2 border border-dashed border-[var(--border-color)] text-[var(--text-tertiary)] cursor-pointer transition-colors hover:text-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t('story.fromGallery', 'From gallery')}
            >
              <ImageIcon size={16} />
              {t('story.fromGallery', 'From gallery')}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFile}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-3 border-t border-[var(--border-color)]">
          <Button variant="primary" className="flex-1" icon={<Send size={16} />} onClick={publish} disabled={!media}>
            {t('story.addToStory', 'Add to story')}
          </Button>
        </div>
      </div>
    </motion.div>,
    document.body
  );
};

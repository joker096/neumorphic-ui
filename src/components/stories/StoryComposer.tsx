import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Image as ImageIcon, Type, Send, X } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { CloseButton } from '../ui/CloseButton';
import { Button } from '../ui/Button';
import { toast } from '../ui/Toast';
import { STORY_GRADIENTS, AUDIENCE_OPTIONS, EXPIRATION_OPTIONS, DEFAULT_AUDIENCE, DEFAULT_EXPIRATION, STORY_CAPTION_MAX_LENGTH } from '../../constants/storyConstants';
import { publishMyStory } from './storiesData';

interface StoryComposerProps {
  open: boolean;
  onClose: () => void;
  isDark?: boolean;
}

interface MediaState {
  kind: 'image' | 'video';
  url: string;
}

export const StoryComposer = ({ open, onClose, isDark = false }: StoryComposerProps) => {
  const { t } = useI18n();
  const [bg, setBg] = useState(STORY_GRADIENTS[0]);
  const [caption, setCaption] = useState('');
  const [audience, setAudience] = useState(DEFAULT_AUDIENCE);
  const [expiration, setExpiration] = useState<string>(DEFAULT_EXPIRATION);
  const [media, setMedia] = useState<MediaState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset draft state each time the composer is opened.
  useEffect(() => {
    if (open) {
      setBg(STORY_GRADIENTS[0]);
      setCaption('');
      setAudience(DEFAULT_AUDIENCE);
      setExpiration(DEFAULT_EXPIRATION);
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
    publishMyStory(
      bg,
      caption.trim(),
      audience,
      expiration,
      media?.kind === 'image' ? media.url : undefined,
      media?.kind === 'video' ? media.url : undefined,
    );
    toast(t('story.published', 'Story published'), 'success');
    if (media) URL.revokeObjectURL(media.url);
    onClose();
  };

  const surfaceClass = isDark
    ? 'bg-[var(--bg-secondary)] border border-[var(--border-color)]'
    : 'bg-white border border-slate-200';
  const labelClass = `text-xs uppercase tracking-widest font-bold mb-2 opacity-50 ${isDark ? 'text-[var(--text-primary)]' : 'text-slate-700'}`;
  const chipBase = isDark
    ? 'bg-white/5 text-gray-300'
    : 'bg-slate-100 text-slate-600';
  const activeChip = 'bg-[var(--accent)] text-[var(--button-primary-text)]';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[210] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('story.composer', 'New story')}
    >
      <div className={`w-full max-w-md rounded-2xl overflow-hidden shadow-2xl ${surfaceClass}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
          <h3 className={`font-semibold ${isDark ? 'text-[var(--text-primary)]' : 'text-slate-900'}`}>{t('story.newStory', 'New story')}</h3>
          <CloseButton onClick={onClose} aria-label={t('common.close')} size="md" />
        </div>

        <div className="p-4">
          <div className={`relative rounded-xl h-56 flex items-center justify-center overflow-hidden bg-gradient-to-br ${bg}`}>
            {media?.kind === 'image' && (
              <img src={media.url} alt="" className="absolute inset-0 w-full h-full object-cover" />
            )}
            {media?.kind === 'video' && (
              <video src={media.url} className="absolute inset-0 w-full h-full object-cover" autoPlay muted loop playsInline />
            )}
            {!media && <Type size={32} className="text-white/70" aria-hidden="true" />}
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
          </div>

          <div className="mt-4">
            <div className={labelClass}>{t('story.background', 'Background')}</div>
            <div className="flex gap-2 flex-wrap">
              {STORY_GRADIENTS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setBg(g)}
                  aria-label={t('story.pickBackground', 'Pick background')}
                  aria-pressed={bg === g}
                  className={`w-10 h-10 min-w-11 min-h-11 rounded-full bg-gradient-to-br ${g} transition-transform active:scale-90 ${bg === g ? 'ring-2 ring-offset-2 ring-[var(--accent)] ring-offset-[var(--bg-secondary)]' : ''}`}
                />
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`w-10 h-10 min-w-11 min-h-11 rounded-full flex items-center justify-center border border-dashed border-[var(--border-color)] ${isDark ? 'text-gray-400' : 'text-slate-400'} cursor-pointer transition-colors hover:text-[var(--accent)]`}
                aria-label={t('story.fromGallery', 'From gallery')}
              >
                <ImageIcon size={16} />
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

          <div className="mt-4">
            <div className={labelClass}>{t('story.audienceLabel', 'Who can see')}</div>
            <div className="grid grid-cols-2 gap-2">
              {AUDIENCE_OPTIONS.map((a) => {
                const Icon = a.icon;
                const active = audience === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAudience(a.id)}
                    aria-pressed={active}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm min-h-11 transition-colors ${active ? activeChip : chipBase}`}
                  >
                    <Icon size={16} aria-hidden="true" />
                    {t(a.labelKey, a.fallback)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4">
            <div className={labelClass}>{t('story.expires', 'Expires after')}</div>
            <div className="flex gap-2">
              {EXPIRATION_OPTIONS.map((e) => {
                const active = expiration === e;
                return (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setExpiration(e)}
                    aria-pressed={active}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium min-h-[var(--control-height-sm)] transition-colors ${active ? activeChip : chipBase}`}
                  >
                    {e}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-3 border-t border-[var(--border-color)]">
          <Button variant="primary" className="flex-1" icon={<Send size={16} />} onClick={publish}>
            {t('story.addToStory', 'Add to story')}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

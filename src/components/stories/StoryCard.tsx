import React, { useState } from 'react';
import { Globe, ImageOff, Play } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { STORY_DEFAULT_GRADIENT } from '../../constants/storyConstants';

interface StoryCardStory {
  userId: number | string;
  userName?: string;
  userColor?: string;
  storyId?: number;
  type?: 'gradient' | 'photo' | 'video';
  bg?: string;
  image?: string;
  video?: string;
  caption?: string;
}

interface StoryCardProps {
  story: StoryCardStory;
}

export const StoryCard: React.FC<StoryCardProps> = ({ story }) => {
  const { t } = useI18n();
  const [mediaFailed, setMediaFailed] = useState(false);
  const bg = story.bg || STORY_DEFAULT_GRADIENT;
  const showImage = story.type === 'photo' && !!story.image && !mediaFailed;
  const showVideo = story.type === 'video' && !!story.video && !mediaFailed;

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-[var(--border-color)] mb-1"
      data-testid="story-card"
    >
      <div className={`relative w-56 h-72 bg-gradient-to-br ${bg} flex items-center justify-center`} data-testid="story-card-bg">
        {showImage && (
          <img src={story.image} alt="" className="absolute inset-0 w-full h-full object-cover" onError={() => setMediaFailed(true)} />
        )}
        {showVideo && (
          <video src={story.video} className="absolute inset-0 w-full h-full object-cover" muted loop playsInline onError={() => setMediaFailed(true)} />
        )}
        {(story.type === 'photo' || story.type === 'video') && mediaFailed && (
          <div className="absolute inset-0 flex items-center justify-center text-white/70" aria-hidden="true">
            <ImageOff size={32} />
          </div>
        )}
        {showVideo && (
          <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center">
              <Play size={18} className="text-white ml-0.5" />
            </div>
          </div>
        )}
        {story.caption && (
          <div className="relative z-10 px-4 text-center text-white text-sm font-medium drop-shadow-md max-w-[85%] break-words">
            {story.caption}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        <Globe size={12} className="shrink-0 opacity-60" aria-hidden="true" />
        <span className="text-xs font-medium truncate">
          {story.userName ? t('story.sharedBy', 'Story') : t('story.sharedStory', 'Story')}
          {story.userName ? ` · ${story.userName}` : ''}
        </span>
      </div>
    </div>
  );
};

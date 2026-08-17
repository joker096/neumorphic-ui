import { Globe, Users, UserCheck, EyeOff, type LucideIcon } from 'lucide-react';

export const STORY_DURATION_MS = 5000;
export const STORY_PROGRESS_TICK_MS = 50;

export const STORY_SHARE_SCHEME = 'nexus';
export const STORY_SHARE_PATH = (userId: number | string, storyId: number | string) =>
  `${STORY_SHARE_SCHEME}://story/${userId}/${storyId}`;

export const STORY_DEFAULT_GRADIENT = 'from-slate-700 via-slate-900 to-black';

export const STORY_GRADIENTS = [
  'from-rose-500 via-red-500 to-orange-500',
  'from-blue-500 via-indigo-500 to-purple-500',
  'from-emerald-500 via-teal-500 to-cyan-500',
  'from-amber-400 via-orange-500 to-rose-500',
  'from-fuchsia-500 via-purple-500 to-indigo-500',
  STORY_DEFAULT_GRADIENT,
];

export interface StoryAudienceOption {
  id: string;
  labelKey: string;
  fallback: string;
  icon: LucideIcon;
}

export const AUDIENCE_OPTIONS: readonly StoryAudienceOption[] = [
  { id: 'all', labelKey: 'story.audience.all', fallback: 'Everyone', icon: Globe },
  { id: 'close', labelKey: 'story.audience.close', fallback: 'Close friends', icon: UserCheck },
  { id: 'custom', labelKey: 'story.audience.custom', fallback: 'Custom', icon: Users },
  { id: 'hide', labelKey: 'story.audience.hide', fallback: 'Hide from', icon: EyeOff },
];

export const DEFAULT_AUDIENCE = 'all';

export const EXPIRATION_OPTIONS = ['6h', '12h', '24h', '48h'] as const;
export type ExpirationOption = (typeof EXPIRATION_OPTIONS)[number];
export const DEFAULT_EXPIRATION: ExpirationOption = '24h';

export const STORY_MINUTES_DIVISOR = 60_000;

export const STORY_CAPTION_MAX_LENGTH = 200;
export const STORY_REPLY_MAX_LENGTH = 200;

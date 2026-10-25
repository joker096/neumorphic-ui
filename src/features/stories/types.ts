/** Story media payload. A photo renders for `durationMs` (default 5000); a video plays out. */
export type StoryMedia =
  | { kind: 'image'; src: string; durationMs?: number }
  | { kind: 'video'; src: string; poster?: string; durationMs?: number };

export interface Story {
  id: string;
  authorId: string;
  media: StoryMedia;
  caption?: string;
  createdAt: string; // ISO
  viewsCount: number;
  likesCount: number;
  likedByMe: boolean;
  viewedByMe: boolean;
}

export interface StoryAuthor {
  id: string;
  name: string;
  avatarUrl: string;
  isMuted?: boolean; // archive
  stories: Story[];
}

export const STORY_PHOTO_DEFAULT_MS = 5000;
export const STORY_VIDEO_FALLBACK_MS = 12000;
export const STORY_LIFETIME_MS = 24 * 60 * 60 * 1000;

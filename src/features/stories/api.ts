import type { Story, StoryAuthor } from './types';
import { STORY_LIFETIME_MS } from './types';

/**
 * Mock data layer. Isolated so a real backend can replace `fetchStories`.
 * Stories expire after 24h (`createdAt`); expired authors are dropped.
 */

const now = new Date();
const ago = (min: number) => new Date(now.getTime() - min * 60_000).toISOString();

const img = (seed: string) => `https://picsum.photos/seed/${seed}/540/960`;

const MOCK_AUTHORS: StoryAuthor[] = [
  {
    id: 'a1',
    name: 'Детский сад «Облака»',
    avatarUrl: img('clouds'),
    stories: [
      { id: 'a1s1', authorId: 'a1', media: { kind: 'image', src: img('clouds1') }, caption: 'Праздник в младшем коттедже', createdAt: ago(14), viewsCount: 42, likesCount: 8, likedByMe: false, viewedByMe: false },
      { id: 'a1s2', authorId: 'a1', media: { kind: 'video', src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', poster: img('clouds2') }, caption: 'Утренняя зарядка', createdAt: ago(40), viewsCount: 19, likesCount: 3, likedByMe: false, viewedByMe: false },
    ],
  },
  {
    id: 'a2',
    name: 'Алиса',
    avatarUrl: img('alice'),
    stories: [
      { id: 'a2s1', authorId: 'a2', media: { kind: 'image', src: img('alice1') }, caption: 'Закат в горах 🌄', createdAt: ago(8), viewsCount: 73, likesCount: 15, likedByMe: true, viewedByMe: false },
      { id: 'a2s2', authorId: 'a2', media: { kind: 'image', src: img('alice2') }, caption: 'Кофе-брейк ☕', createdAt: ago(90), viewsCount: 31, likesCount: 6, likedByMe: false, viewedByMe: false },
    ],
  },
  {
    id: 'a3',
    name: 'Дмитрий',
    avatarUrl: img('dima'),
    stories: [
      { id: 'a3s1', authorId: 'a3', media: { kind: 'video', src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', poster: img('dima1') }, caption: 'Шиппим релиз 🚀', createdAt: ago(25), viewsCount: 55, likesCount: 12, likedByMe: false, viewedByMe: true },
    ],
  },
  {
    id: 'a4',
    name: 'Катя',
    avatarUrl: img('katya'),
    stories: [
      { id: 'a4s1', authorId: 'a4', media: { kind: 'image', src: img('katya1') }, caption: 'Новая коллекция ✨', createdAt: ago(12), viewsCount: 210, likesCount: 44, likedByMe: false, viewedByMe: false },
      { id: 'a4s2', authorId: 'a4', media: { kind: 'image', src: img('katya2') }, caption: 'Примерка', createdAt: ago(70), viewsCount: 88, likesCount: 20, likedByMe: false, viewedByMe: false },
      { id: 'a4s3', authorId: 'a4', media: { kind: 'image', src: img('katya3') }, caption: 'Выездная съёмка', createdAt: ago(150), viewsCount: 44, likesCount: 9, likedByMe: false, viewedByMe: true },
    ],
  },
  {
    id: 'a5',
    name: 'Лаборатория «Архив»',
    avatarUrl: img('arch'),
    isMuted: true,
    stories: [
      { id: 'a5s1', authorId: 'a5', media: { kind: 'video', src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', poster: img('arch1') }, caption: 'Научная пятница', createdAt: ago(5), viewsCount: 9, likesCount: 2, likedByMe: false, viewedByMe: false },
    ],
  },
];

/** Authors with at least one story created within the last 24h. */
export function filterVisibleAuthors(authors: StoryAuthor[], at: number = Date.now()): StoryAuthor[] {
  const cutoff = at - STORY_LIFETIME_MS;
  const out: StoryAuthor[] = [];
  for (const a of authors) {
    const stories = a.stories.filter((s) => new Date(s.createdAt).getTime() >= cutoff);
    if (stories.length > 0) out.push({ ...a, stories });
  }
  return out;
}

let loaded = false;
let cache: StoryAuthor[] = [];

/** Load mock authors. Subsequent calls return the cached (mutable) list. */
export async function fetchStories(): Promise<StoryAuthor[]> {
  if (!loaded) {
    cache = filterVisibleAuthors(MOCK_AUTHORS);
    loaded = true;
  }
  return cache;
}

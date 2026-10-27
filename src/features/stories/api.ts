import type { StoryAuthor } from './types';
import { STORY_LIFETIME_MS } from './types';
import { storyImage } from './placeholder';

/**
 * Mock data layer. Isolated so a real backend can replace `fetchStories`.
 * Stories expire after 24h (`createdAt`); expired authors are dropped.
 *
 * Media is generated locally (`storyImage`) because the app CSP allows
 * `img-src 'self' data: blob:` only — remote demo hosts would render broken.
 */

const now = new Date();
const ago = (min: number) => new Date(now.getTime() - min * 60_000).toISOString();

const avatar = (seed: string, label: string) => storyImage(seed, { width: 200, height: 200, label });
const cover = (seed: string) => storyImage(seed, { width: 540, height: 960 });

/** Sample clip hosted over HTTPS (`media-src … https:` is allowed; images are not). */
const SAMPLE_VIDEO = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

const MOCK_AUTHORS: StoryAuthor[] = [
  {
    id: 'a1',
    name: 'Детский сад «Облака»',
    avatarUrl: avatar('clouds', 'Детский сад'),
    stories: [
      { id: 'a1s1', authorId: 'a1', media: { kind: 'image', src: cover('clouds1') }, caption: 'Праздник в младшем коттедже', createdAt: ago(14), viewsCount: 42, likesCount: 8, likedByMe: false, viewedByMe: false },
      { id: 'a1s2', authorId: 'a1', media: { kind: 'video', src: SAMPLE_VIDEO, poster: cover('clouds2') }, caption: 'Утренняя зарядка', createdAt: ago(40), viewsCount: 19, likesCount: 3, likedByMe: false, viewedByMe: false },
    ],
  },
  {
    id: 'a2',
    name: 'Алиса',
    avatarUrl: avatar('alice', 'Алиса'),
    stories: [
      { id: 'a2s1', authorId: 'a2', media: { kind: 'image', src: cover('alice1') }, caption: 'Закат в горах 🌄', createdAt: ago(8), viewsCount: 73, likesCount: 15, likedByMe: true, viewedByMe: false },
      { id: 'a2s2', authorId: 'a2', media: { kind: 'image', src: cover('alice2') }, caption: 'Кофе-брейк ☕', createdAt: ago(90), viewsCount: 31, likesCount: 6, likedByMe: false, viewedByMe: false },
    ],
  },
  {
    id: 'a3',
    name: 'Дмитрий',
    avatarUrl: avatar('dima', 'Дмитрий'),
    stories: [
      { id: 'a3s1', authorId: 'a3', media: { kind: 'video', src: SAMPLE_VIDEO, poster: cover('dima1') }, caption: 'Шиппим релиз 🚀', createdAt: ago(25), viewsCount: 55, likesCount: 12, likedByMe: false, viewedByMe: true },
    ],
  },
  {
    id: 'a4',
    name: 'Катя',
    avatarUrl: avatar('katya', 'Катя'),
    stories: [
      { id: 'a4s1', authorId: 'a4', media: { kind: 'image', src: cover('katya1') }, caption: 'Новая коллекция ✨', createdAt: ago(12), viewsCount: 210, likesCount: 44, likedByMe: false, viewedByMe: false },
      { id: 'a4s2', authorId: 'a4', media: { kind: 'image', src: cover('katya2') }, caption: 'Примерка', createdAt: ago(70), viewsCount: 88, likesCount: 20, likedByMe: false, viewedByMe: false },
      { id: 'a4s3', authorId: 'a4', media: { kind: 'image', src: cover('katya3') }, caption: 'Выездная съёмка', createdAt: ago(150), viewsCount: 44, likesCount: 9, likedByMe: false, viewedByMe: true },
    ],
  },
  {
    id: 'a5',
    name: 'Лаборатория «Архив»',
    avatarUrl: avatar('arch', 'Лаборатория'),
    isMuted: true,
    stories: [
      { id: 'a5s1', authorId: 'a5', media: { kind: 'video', src: SAMPLE_VIDEO, poster: cover('arch1') }, caption: 'Научная пятница', createdAt: ago(5), viewsCount: 9, likesCount: 2, likedByMe: false, viewedByMe: false },
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

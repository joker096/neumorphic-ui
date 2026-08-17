import { STORY_GRADIENTS, STORY_DEFAULT_GRADIENT } from '../../constants/storyConstants';

export interface StoryItem {
  id: number;
  type: 'gradient' | 'photo';
  bg?: string;
  image?: string;
  caption?: string;
  time: number;
  views: number;
  reactions: number;
  liked?: boolean;
  audience?: string;
  expiration?: string;
}

export interface StoryUser {
  id: number | string;
  name: string;
  color: string;
  avatarColor: string;
  verified?: boolean;
  isMe?: boolean;
  stories: StoryItem[];
}

const now = Date.now();
const mins = (m: number) => now - m * 60_000;

export const STORY_USERS: StoryUser[] = [
  {
    id: 1,
    name: 'Alice',
    color: 'from-rose-400 to-red-500',
    avatarColor: 'from-rose-400 to-red-500',
    stories: [
      { id: 11, type: 'gradient', bg: STORY_GRADIENTS[0], caption: 'Sunset hike with the team 🌄', time: mins(14), views: 42, reactions: 8 },
      { id: 12, type: 'gradient', bg: STORY_GRADIENTS[2], caption: 'Coffee break ☕', time: mins(40), views: 19, reactions: 3 },
    ],
  },
  {
    id: 2,
    name: 'Bob',
    color: 'from-blue-400 to-indigo-400',
    avatarColor: 'from-blue-400 to-indigo-400',
    stories: [
      { id: 21, type: 'gradient', bg: STORY_GRADIENTS[1], caption: 'Shipping the new build 🚀', time: mins(8), views: 73, reactions: 15 },
    ],
  },
  {
    id: 3,
    name: 'Charlie',
    color: 'from-amber-400 to-orange-400',
    avatarColor: 'from-amber-400 to-orange-400',
    stories: [
      { id: 31, type: 'gradient', bg: STORY_GRADIENTS[3], caption: 'Road trip!', time: mins(120), views: 11, reactions: 2 },
      { id: 32, type: 'gradient', bg: STORY_GRADIENTS[4], caption: 'Live from the show 🎤', time: mins(150), views: 5, reactions: 1 },
    ],
  },
  {
    id: 4,
    name: 'Diana',
    color: 'from-purple-400 to-fuchsia-400',
    avatarColor: 'from-purple-400 to-fuchsia-400',
    verified: true,
    stories: [
      { id: 41, type: 'gradient', bg: STORY_GRADIENTS[4], caption: 'New collection drop ✨', time: mins(30), views: 210, reactions: 44 },
    ],
  },
  {
    id: 5,
    name: 'Eve',
    color: 'from-teal-400 to-emerald-400',
    avatarColor: 'from-teal-400 to-emerald-400',
    stories: [
      { id: 51, type: 'gradient', bg: STORY_GRADIENTS[2], caption: 'Morning run done 🏃', time: mins(55), views: 27, reactions: 6 },
    ],
  },
];

export const MY_STORY_USER: StoryUser = {
  id: 0,
  name: 'You',
  color: 'from-[var(--accent)] to-purple-500',
  avatarColor: 'from-[var(--accent)] to-purple-500',
  isMe: true,
  stories: [
    { id: 1, type: 'gradient', bg: STORY_GRADIENTS[5], caption: 'My day, my rules', time: mins(95), views: 33, reactions: 9 },
  ],
};

export function findStoryUser(id: number | string): StoryUser {
  if (id === 0 || id === 'me') return MY_STORY_USER;
  return STORY_USERS.find((u) => u.id === Number(id)) ?? {
    id: Number(id),
    name: 'User',
    color: 'from-[var(--accent)] to-purple-500',
    avatarColor: 'from-[var(--accent)] to-purple-500',
    stories: [{ id: Date.now(), type: 'gradient', bg: STORY_GRADIENTS[0], caption: '', time: Date.now(), views: 0, reactions: 0 }],
  };
}

let myStorySeq = 1000;
export function publishMyStory(bg: string, caption: string, audience: string, expiration?: string) {
  MY_STORY_USER.stories.unshift({
    id: myStorySeq++,
    type: 'gradient',
    bg,
    caption,
    time: Date.now(),
    views: 0,
    reactions: 0,
    audience,
    expiration,
  });
  return MY_STORY_USER;
}

export { STORY_DEFAULT_GRADIENT };

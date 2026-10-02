import type { MockChannel } from '../../types/constants';
import { isoDaysAgo } from './isoDaysAgo';

export const MOCK_CHANNELS: MockChannel[] = [
  {
    id: 4,
    name: "Tech Insights",
    isChannel: true,
    message: "New update on the neural engines.",
    time: "11:00",
    unread: 12,
    color: "from-slate-700 to-slate-900",
    subscribers: 1248,
    username: "techinsights",
    verified: true,
    description: "Daily updates on neural engines, vector embeddings and AI tooling.",
    history: [
      {
        id: 401,
        sender: "them",
        text: "Welcome to Tech Insights. Today we dive into the new vector embeddings...",
        time: "Mon",
        date: isoDaysAgo(1),
      },
      {
        id: 402,
        sender: "them",
        text: "New update on the neural engines.",
        time: "11:00",
        date: isoDaysAgo(0),
      },
    ],
  },
  {
    id: 5,
    name: "Design Drops",
    isChannel: true,
    message: "10 tips for better neumorphic forms.",
    time: "Feb 24",
    unread: 0,
    color: "from-purple-500 to-fuchsia-500",
    subscribers: 342,
    username: "designdrops",
    verified: false,
    description: "Design inspiration, form patterns and UI details.",
    history: [
      {
        id: 501,
        sender: "them",
        text: "10 tips for better neumorphic forms.",
        time: "Feb 24",
        date: isoDaysAgo(9),
      },
      {
        id: 502,
        sender: "them",
        text: "Read more: https://example.com/neumorphic-forms-tips",
        time: "Feb 25",
        date: isoDaysAgo(8),
      },
    ],
  },
];

/**
 * Shared constants and mock data for the application
 */

export interface MockCall {
  id: number;
  name: string;
  time: string;
  type: string;
  duration?: string;
}

export interface MockChat {
  id: number;
  name: string;
  message: string;
  time: string;
  unread: number;
  online: boolean;
  color: string;
  history?: any[];
  isBot?: boolean;
}

export interface MockChannel {
  id: number;
  name: string;
  isChannel?: boolean;
  message: string;
  time: string;
  unread: number;
  color: string;
  history: any[];
}

export interface OnlineContact {
  id: number;
  name: string;
  color: string;
}

export interface StickerPack {
  id: string;
  name: string;
  stickers: string[];
}

export const MOCK_CALLS: MockCall[] = [
  {
    id: 1,
    name: "Alice Freeman",
    time: "10:42 AM",
    type: "outgoing",
    duration: "5m 23s",
  },
  { id: 2, name: "+1 (555) 019-283", time: "Yesterday", type: "missed" },
  {
    id: 3,
    name: "Operations Team",
    time: "Yesterday",
    type: "incoming",
    duration: "12m 4s",
  },
  { id: 4, name: "Unknown", time: "Mon, 14:20", type: "missed" },
  {
    id: 5,
    name: "Bob Smith",
    time: "Sun, 08:15",
    type: "incoming",
    duration: "2m 10s",
  },
];

export const MOCK_CHATS: MockChat[] = [
  {
    id: 1,
    name: "Alice Freeman",
    message: "Hey, are we still on for tomorrow? Let me know!",
    time: "10:42",
    unread: 2,
    online: true,
    color: "from-pink-400 to-rose-400",
    history: [
      {
        id: 101,
        sender: "them",
        text: "Hey! Look at this new design concept 🎨",
        time: "10:35",
      },
      {
        id: 102,
        sender: "them",
        type: "image",
        url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
        time: "10:36",
      },
      {
        id: 103,
        sender: "me",
        text: "Wow, the colors are amazing! Is this for the new dashboard?",
        time: "10:38",
        status: "read",
      },
      {
        id: 104,
        sender: "them",
        type: "audio",
        duration: "0:24",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        time: "10:40",
      },
      { id: 105, sender: "them", text: "Let me know!", time: "10:42" },
    ],
  },
  {
    id: 2,
    name: "Design Team",
    message: "Bob: Let's review the new components later.",
    time: "Yesterday",
    unread: 5,
    online: false,
    color: "from-amber-400 to-orange-500",
    history: [
      {
        id: 201,
        sender: "them",
        text: "Alice: I pushed the updated files.",
        time: "Yesterday, 14:20",
      },
      {
        id: 202,
        sender: "them",
        type: "video",
        thumb:
          "https://images.unsplash.com/photo-1616469829581-73993eb86b02?q=80&w=2670&auto=format&fit=crop",
        duration: "0:45",
        time: "Yesterday, 15:10",
      },
      {
        id: 203,
        sender: "them",
        text: "Bob: Let's review the new components later.",
        time: "Yesterday, 16:30",
      },
    ],
  },
  {
    id: 3,
    name: "Victor",
    message: "Voice message (0:14)",
    time: "Tue",
    unread: 0,
    online: true,
    color: "from-indigo-400 to-cyan-400",
    history: [
      {
        id: 301,
        sender: "me",
        text: "Are you available to sync on the server deployment?",
        time: "Tue, 09:15",
        status: "read",
      },
      {
        id: 302,
        sender: "them",
        type: "audio",
        duration: "0:14",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        time: "Tue, 09:20",
      },
    ],
  },
  {
    id: 99,
    name: "Nexus Assistant",
    message: "Settings updated successfully.",
    time: "09:00",
    unread: 1,
    online: true,
    color: "from-slate-400 to-gray-500",
    isBot: true,
    history: [
      {
        id: 991,
        sender: "them",
        text: "Welcome to Nexus Network! How can I assist you today?",
        time: "08:58",
        keyboard: [
          [{ text: "🔒 Setup 2FA", action: "setup_2fa" }, { text: "💬 Help", action: "help" }],
          [{ text: "🛡️ Advanced Privacy", action: "privacy" }]
        ]
      },
      {
        id: 992,
        sender: "me",
        text: "/status",
        time: "08:59",
        status: "read",
      },
      {
        id: 993,
        sender: "them",
        text: "All critical services are online.\nLatency: 14ms\nNodes: 24 active",
        time: "09:00",
      }
    ]
  }
];

export const MOCK_CHANNELS: MockChannel[] = [
  {
    id: 4,
    name: "Tech Insights",
    isChannel: true,
    message: "New update on the neural engines.",
    time: "11:00",
    unread: 12,
    color: "from-slate-700 to-slate-900",
    history: [
      {
        id: 401,
        sender: "them",
        text: "Welcome to Tech Insights. Today we dive into the new vector embeddings...",
        time: "Mon",
      },
      {
        id: 402,
        sender: "them",
        text: "New update on the neural engines.",
        time: "11:00",
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
    history: [
      {
        id: 501,
        sender: "them",
        text: "10 tips for better neumorphic forms.",
        time: "Feb 24",
      },
    ],
  },
];

export const ONLINE_CONTACTS: OnlineContact[] = [
  { id: 1, name: "Alice", color: "from-pink-400 to-rose-400" },
  { id: 2, name: "Bob", color: "from-blue-400 to-indigo-400" },
  { id: 3, name: "Charlie", color: "from-amber-400 to-orange-400" },
  { id: 4, name: "Diana", color: "from-purple-400 to-fuchsia-400" },
  { id: 5, name: "Eve", color: "from-teal-400 to-emerald-400" },
];

export const STICKER_PACKS: StickerPack[] = [
  { id: 'default', name: 'Default', stickers: ['👍', '❤️', '😂', '🔥', '😢', '🎉', '👋', '💀', '👑', '🔻', '😎', '🥳'] },
  { id: 'animals', name: 'Animals', stickers: ['🐱', '🐶', '🐾', '🦋', '🐮', '🐸'] },
  { id: 'nature', name: 'Nature', stickers: ['🌸', '🌿', '🌺', '🍃', '🌻', '🍀'] },
  { id: 'food', name: 'Food', stickers: ['🍕', '🍔', '🍱', '🍷', '☕', '🍯'] },
];

export const STICKER_EMOJI = ['😀', '😂', '🤣', '🤔', '😍', '😎', '🤖', '🥺', '😱', '🤯', '🫡', '🥳'];

export const MENTION_PATTERN = /@(\w+)/g;

export const parseMentions = (text: string): { text: string; mentions: { name: string; index: number }[] } => {
  const mentions: { name: string; index: number }[] = [];
  let match;
  const regex = new RegExp(MENTION_PATTERN);
  while ((match = regex.exec(text)) !== null) {
    mentions.push({ name: match[1], index: match.index });
  }
  return { text, mentions };
};

export const isDNDEnabled = (): boolean => {
  try {
    const dndEnabled = localStorage.getItem("app_dnd_enabled") === "true";
    const dndFrom = localStorage.getItem("app_dnd_from") || "22:00";
    const dndTo = localStorage.getItem("app_dnd_to") || "08:00";
    if (!dndEnabled) return false;
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentMinutes = hours * 60 + minutes;
    const [fromH, fromM] = dndFrom.split(':').map(Number);
    const [toH, toM] = dndTo.split(':').map(Number);
    const fromMinutes = fromH * 60 + fromM;
    const toMinutes = toH * 60 + toM;
    if (fromMinutes <= toMinutes) {
      return currentMinutes >= fromMinutes && currentMinutes <= toMinutes;
    } else {
      return currentMinutes >= fromMinutes || currentMinutes <= toMinutes;
    }
  } catch {
    return false;
  }
};

export const isPriorityContact = (contactName: string): boolean => {
  try {
    const priorityStr = localStorage.getItem("app_priority_contacts");
    if (!priorityStr) return false;
    const names = JSON.parse(priorityStr);
    return names.some((n: string) => contactName.toLowerCase().includes(n.toLowerCase()) || n.toLowerCase().includes(contactName.toLowerCase()));
  } catch {
    return false;
  }
};

export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ru', name: 'Русский', flag: '🇷🺸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🪸' },
  { code: 'zh', name: '中文', flag: '🇭🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
];

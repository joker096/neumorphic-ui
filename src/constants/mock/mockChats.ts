import type { MockChat } from '../../types/constants';
import { isoDaysAgo } from './isoDaysAgo';

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
        date: isoDaysAgo(0),
      },
      {
        id: 102,
        sender: "them",
        type: "image",
        url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
        time: "10:36",
        date: isoDaysAgo(0),
      },
      {
        id: 103,
        sender: "me",
        text: "Wow, the colors are amazing! Is this for the new dashboard?",
        time: "10:38",
        date: isoDaysAgo(0),
        status: "read",
      },
      {
        id: 104,
        sender: "them",
        type: "audio",
        duration: "0:24",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        time: "10:40",
        date: isoDaysAgo(0),
      },
       {
         id: 106,
         sender: "them",
         type: "file",
          fileName: "dashboard-mockup.pdf",
          time: "10:41",
          date: isoDaysAgo(0),
        },
        { id: 105, sender: "them", text: "Let me know!", time: "10:42", date: isoDaysAgo(0) },
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
    type: "group",
    createdAt: new Date(2026, 1, 10).getTime(),
    memberIds: ["contact_001", "contact_002"],
    members: [
      { id: "contact_001", name: "Alice Freeman", color: "from-pink-400 to-rose-400", role: "owner" },
      { id: "contact_002", name: "Bob Smith", color: "from-blue-400 to-indigo-400", role: "member" },
    ],
    group: { inviteToken: "ma_2", slowModeSeconds: 0, ownerId: "contact_001" },
    history: [
      {
        id: 201,
        sender: "them",
        text: "Alice: I pushed the updated files.",
        time: "Yesterday, 14:20",
        date: isoDaysAgo(1),
      },
      {
        id: 202,
        sender: "them",
        type: "video",
        thumb:
          "https://images.unsplash.com/photo-1616469829581-73993eb86b02?q=80&w=2670&auto=format&fit=crop",
        duration: "0:45",
        time: "Yesterday, 15:10",
        date: isoDaysAgo(1),
      },
      {
        id: 203,
        sender: "them",
        text: "Bob: Let's review the new components later.",
        time: "Yesterday, 16:30",
        date: isoDaysAgo(1),
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
        date: isoDaysAgo(2),
        status: "read",
      },
      {
        id: 302,
        sender: "them",
        type: "audio",
        duration: "0:14",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        time: "Tue, 09:20",
        date: isoDaysAgo(2),
      },
      {
        id: 303,
        sender: "them",
        type: "file",
        fileName: "old-scan.pdf",
        time: "Jul 28",
        date: isoDaysAgo(30),
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
        date: isoDaysAgo(0),
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
        date: isoDaysAgo(0),
        status: "read",
      },
      {
        id: 993,
        sender: "them",
        text: "All critical services are online.\nLatency: 14ms\nNodes: 24 active",
        time: "09:00",
        date: isoDaysAgo(0),
      }
    ]
  }
];

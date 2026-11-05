import { create } from 'zustand';
import { chats as seedChats, messages as seedMessages } from '../data/mock';
import type { Chat, Message } from '../types';

export interface OutgoingDraft {
  text?: string;
  images?: string[];
  voice?: Message['voice'];
}

interface ChatsState {
  chats: Chat[];
  messages: Record<string, Message[]>;
  activeChatId: string | null;
  hasStarted: boolean;
  openChat: (id: string) => void;
  closeChat: () => void;
  markRead: (id: string) => void;
  sendMessage: (chatId: string, draft: OutgoingDraft) => Message;
  startChatting: () => void;
  archivedVisible: boolean;
  toggleArchived: () => void;
}

const clock = (): string => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

const previewOf = (draft: OutgoingDraft): string => {
  if (draft.text?.trim()) return draft.text.trim();
  if (draft.images?.length) return '📷 Photo';
  if (draft.voice) return '🎤 Voice message';
  return 'Message';
};

let sequence = 0;

export const useChatsStore = create<ChatsState>((set, get) => ({
  chats: seedChats,
  messages: seedMessages,
  activeChatId: null,
  hasStarted: false,
  archivedVisible: false,

  openChat: (id) => {
    get().markRead(id);
    set({ activeChatId: id });
  },

  closeChat: () => set({ activeChatId: null }),

  markRead: (id) =>
    set((state) => ({
      chats: state.chats.map((chat) => (chat.id === id ? { ...chat, unread: 0 } : chat)),
    })),

  sendMessage: (chatId, draft) => {
    sequence += 1;
    const time = clock();
    const message: Message = {
      id: `${chatId}-new-${sequence}`,
      chatId,
      from: 'me',
      text: draft.text?.trim() || undefined,
      images: draft.images,
      voice: draft.voice,
      time,
      status: 'sent',
    };
    set((state) => ({
      messages: { ...state.messages, [chatId]: [...(state.messages[chatId] ?? []), message] },
      chats: state.chats.map((chat) =>
        chat.id === chatId
          ? { ...chat, lastMessage: previewOf(draft), time, unread: 0 }
          : chat,
      ),
    }));
    return message;
  },

  /** A chat was opened at least once: the list leaves its empty state. */
  startChatting: () => set({ hasStarted: true }),

  toggleArchived: () => set((state) => ({ archivedVisible: !state.archivedVisible })),
}));

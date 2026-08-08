import type { Contact } from '../../types/contact';
import type { P2PChannel, BotConfig, ScheduledMessage } from '../types';

export interface ChatSlice {
  chats: any[];
  setChats: (updater: any[] | ((prev: any[]) => any[])) => void;
  forwardMessage: (message: any, targetChatId: string) => void;
  contacts: Contact[];
  setContacts: (updater: Contact[] | ((prev: Contact[]) => Contact[])) => void;
  favoriteContacts: string[];
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  channels: P2PChannel[];
  setChannels: (updater: P2PChannel[] | ((prev: P2PChannel[]) => P2PChannel[])) => void;
  bots: BotConfig[];
  setBots: (updater: BotConfig[] | ((prev: BotConfig[]) => BotConfig[])) => void;
  scheduledQueue: { messages: ScheduledMessage[]; addMessage: (msg: ScheduledMessage) => void; removeMessage: (id: string) => void };
  archivedChats: (string | number)[];
  toggleArchive: (id: string | number) => void;
  pinChat: (chatId: string | number) => void;
  pinnedMessageList: Array<{ id: number; chatId: string | number; pinBy: string; pinnedAt: number }>;
  addPinnedMessage: (pin: { id: number; chatId: string | number; pinBy: string }) => void;
  removePinnedMessage: (id: number) => void;
}

export const createChatSlice = (set: any, get: any): ChatSlice => ({
  chats: [],
  setChats: (updater) => set((state: any) => ({
    chats: typeof updater === 'function' ? updater(state.chats) : updater
  })),
  forwardMessage: (message: any, targetChatId: string) => {
    set((storeState: any) => {
      const anonymized = storeState.forwardAnonymization ? {
        ...message, forwardedAt: Date.now()
      } : message;
      const updatedChats = storeState.chats.map((chat: any) => {
        if (chat.id === targetChatId && Array.isArray(chat.history)) {
          return { ...chat, history: [...chat.history, anonymized] };
        }
        return chat;
      });
      return { chats: updatedChats };
    });
  },
  contacts: [],
  setContacts: (updater) => set((state: any) => ({
    contacts: typeof updater === 'function' ? updater(state.contacts) : updater
  })),
  favoriteContacts: [],
  addFavorite: (id) => set((state: any) => ({
    favoriteContacts: state.favoriteContacts.includes(id) ? state.favoriteContacts : [...state.favoriteContacts, id]
  })),
  removeFavorite: (id) => set((state: any) => ({
    favoriteContacts: state.favoriteContacts.filter((i: string) => i !== id)
  })),
  channels: [],
  setChannels: (updater) => set((state: any) => ({
    channels: typeof updater === 'function' ? updater(state.channels) : updater
  })),
  bots: [],
  setBots: (updater) => set((state: any) => ({
    bots: typeof updater === 'function' ? updater(state.bots) : updater
  })),
  scheduledQueue: {
    messages: [],
    addMessage: (msg) => set((state: any) => ({ scheduledQueue: { ...state.scheduledQueue, messages: [...state.scheduledQueue.messages, msg] } })),
    removeMessage: (id) => set((state: any) => ({ scheduledQueue: { ...state.scheduledQueue, messages: state.scheduledQueue.messages.filter((m: any) => m.id !== id) } }))
  },
  archivedChats: [],
  toggleArchive: (id) => set((state: any) => ({
    archivedChats: state.archivedChats.includes(id) ? state.archivedChats.filter((i: string | number) => i !== id) : [...state.archivedChats, id]
  })),
  pinChat: (chatId) => set((state: any) => {
    const pinnedCount = state.chats.filter((c: any) => c.pinned).length;
    const chat = state.chats.find((c: any) => c.id === chatId);
    if (!chat) return state;
    if (chat.pinned) return { chats: state.chats.map((c: any) => c.id === chatId ? { ...c, pinned: false } : c) };
    if (pinnedCount >= 3) return state;
    return { chats: state.chats.map((c: any) => c.id === chatId ? { ...c, pinned: true } : c) };
  }),
  pinnedMessageList: [],
  addPinnedMessage: (pin) => set((state: any) => ({ pinnedMessageList: [...state.pinnedMessageList, { ...pin, pinnedAt: state.pinnedMessageList.length }] })),
  removePinnedMessage: (id) => set((state: any) => ({ pinnedMessageList: state.pinnedMessageList.filter((p: any) => p.id !== id) })),
});

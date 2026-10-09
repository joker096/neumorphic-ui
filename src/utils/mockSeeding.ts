import type { Contact } from '../types/contact';
import type { P2PChannel } from '../store/types';
import { MOCK_CHANNELS } from '../constants/mock/mockChannels';
import { MOCK_CHATS } from '../constants/mock/mockChats';
import { MOCK_CONTACTS } from '../constants/mock/mockContacts';
import { MOCK_CALLS } from '../constants/mock/mockCalls';

/**
 * Mock bubbles carry only `date` (YYYY-MM-DD) + `time` (`"10:42"` or a label
 * like `"Jul 28"`), but the live app orders and renders the list from `ts`.
 * Stamp it once at seed time so the recency sort and the derived list time see
 * the demo's real chronology instead of falling back to message-id order.
 * Clock times map to that day's local time; label times land at noon.
 */
function mockMessageStamp(m: any): { ts?: number } {
  if (m?.ts != null || typeof m?.date !== 'string') return {};
  const clock = typeof m.time === 'string' && /^\d{1,2}:\d{2}$/.test(m.time) ? m.time : '12:00';
  const parsed = Date.parse(`${m.date}T${clock}:00`);
  return Number.isFinite(parsed) ? { ts: parsed } : {};
}

function seedHistory(history: any): any {
  return Array.isArray(history)
    ? history.map((m: any) => ({ ...m, ...mockMessageStamp(m) }))
    : history;
}

/**
 * Seed mock data into the store (called once on app init)
 */
export function seedMockData(
  setChats: (updater: any[]) => void,
  setContacts: (updater: Contact[] | ((prev: Contact[]) => Contact[])) => void,
  setChannels: (updater: P2PChannel[] | ((prev: P2PChannel[]) => P2PChannel[])) => void,
  setCallHistory: (updater: any[] | ((prev: any[]) => any[])) => void,
  callHistory: any[],
  chats: any[],
  contacts: Contact[],
  channels: P2PChannel[],
) {
  if (chats.length === 0) {
    setChats(MOCK_CHATS.map((chat: any) => ({ ...chat, history: seedHistory(chat.history) })) as any);
  }
  if (contacts.length === 0) {
    setContacts(MOCK_CONTACTS);
  }
  if (channels.length === 0) {
    setChannels(
      MOCK_CHANNELS.map((c: any) => ({
        id: c.id.toString(),
        channelId: c.id.toString(),
        name: c.name,
        ownerPublicKey: 'MOCK_OWNER',
        ownerId: 'mock1',
        subscribers: c.subscribers,
        subscriberCount: c.subscribers ?? 15,
        username: c.username,
        verified: c.verified,
        description: c.description,
        postCount: c.history.length,
        isPrivate: false,
        isPublic: true,
        createdAt: Date.now(),
        color: c.color,
        message: c.message,
        time: c.time,
        unread: c.unread,
        isChannel: true,
        history: seedHistory(c.history),
      }))
    ) as any;
  }
  if (callHistory.length === 0) {
    setCallHistory(MOCK_CALLS.map((call) => ({
      id: String(call.id),
      name: call.name,
      time: call.time,
      type: call.type,
      duration: call.duration,
    })));
  }
}

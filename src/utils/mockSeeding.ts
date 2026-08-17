import type { Contact } from '../types/contact';
import type { P2PChannel } from '../store/types';
import { MOCK_CHANNELS, MOCK_CHATS, MOCK_CONTACTS, MOCK_CALLS } from '../constants';

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
    setChats(MOCK_CHATS as any);
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
        subscribers: [],
        subscriberCount: 15,
        postCount: c.history.length,
        isPrivate: false,
        isPublic: true,
        createdAt: Date.now(),
        color: c.color,
        message: c.message,
        time: c.time,
        unread: c.unread,
        isChannel: true,
        history: c.history,
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

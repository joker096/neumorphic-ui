/**
 * IndexedDB persistence layer using idb-keyval
 * Provides async store/retrieve for all app data
 */

import { set, get, del, clear, keys } from 'idb-keyval';
import { STORAGE_KEYS } from '../constants/storage';

// Re-export for use in store
export { set, get, del, clear, keys };

// --- Chat operations ---

export async function saveChat(chat: any): Promise<void> {
  const key = `chat:${chat.id}`;
  await set(key, { ...chat, chatId: chat.id, updatedAt: Date.now() });

  // Maintain a list for bulk retrieval
  const all = await get('chats_list') || [];
  const idx = all.findIndex((c: any) => c.id === chat.id);
  if (idx === -1) {
    all.push({ id: chat.id, name: chat.name, unread: chat.unread || 0, updatedAt: Date.now() });
  } else {
    all[idx] = { id: chat.id, name: chat.name, unread: chat.unread || 0, updatedAt: Date.now() };
  }
  await set('chats_list', all);
}

export async function getAllChats(): Promise<any[]> {
  const list = await get('chats_list') || [];
  // Fetch full data for each chat
  const results = [];
  for (const item of list) {
    const chat = await get(`chat:${item.id}`);
    if (chat) results.push(chat);
  }
  return results.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export async function deleteChat(chatId: string | number): Promise<void> {
  await del(`chat:${chatId}`);
  const all = await get('chats_list') || [];
  await set('chats_list', all.filter((c: any) => c.id !== chatId));
}

export async function clearChats(): Promise<void> {
  const list = await get('chats_list') || [];
  for (const item of list) {
    await del(`chat:${item.id}`);
  }
  await set('chats_list', []);
}

// --- Contact operations ---

export async function saveContact(contact: any): Promise<void> {
  await set(`contact:${contact.id}`, contact);

  const all = (await get('contacts_list') || []).filter((c: any) => c.id !== contact.id);
  all.push({ id: contact.id, name: contact.name, phone: contact.phone });
  await set('contacts_list', all);
}

export async function getAllContacts(): Promise<any[]> {
  const list = await get('contacts_list') || [];
  const results = [];
  for (const item of list) {
    const contact = await get(`contact:${item.id}`);
    if (contact) results.push(contact);
  }
  return results;
}

// --- Channel operations ---

export async function saveChannel(channel: any): Promise<void> {
  await set(`channel:${channel.id}`, channel);

  const all = (await get('channels_list') || []).filter((c: any) => c.id !== channel.id);
  all.push({ id: channel.id, name: channel.name, subscriberCount: channel.subscriberCount || 0 });
  await set('channels_list', all);
}

export async function getAllChannels(): Promise<any[]> {
  const list = await get('channels_list') || [];
  const results = [];
  for (const item of list) {
    const channel = await get(`channel:${item.id}`);
    if (channel) results.push(channel);
  }
  return results;
}

// --- Bot operations ---

export async function saveBot(bot: any): Promise<void> {
  const all = (await get('bots_list') || []).map((b: any) => b.id === bot.id ? bot : b);
  if (!all.find((b: any) => b.id === bot.id)) {
    all.push(bot);
  }
  await set('bots_list', all);
}

export async function getAllBots(): Promise<any[]> {
  return (await get('bots_list')) || [];
}

// --- Scheduled message operations ---

export async function addScheduledMessage(msg: any): Promise<void> {
  const all = (await get('scheduled_list') || []);
  all.push(msg);
  await set('scheduled_list', all);
}

export async function removeScheduledMessage(id: string): Promise<void> {
  const all = (await get('scheduled_list') || []).filter((m: any) => m.id !== id);
  await set('scheduled_list', all);
}

export async function getAllScheduledMessages(): Promise<any[]> {
  const all = await get('scheduled_list') || [];
  return all.filter((m: any) => m.scheduledAt > Date.now());
}

export async function clearScheduledMessages(): Promise<void> {
  await set('scheduled_list', []);
}

// --- Recording operations ---

export async function saveRecording(recording: any): Promise<void> {
  const all = (await get('recordings_list') || []);
  all.unshift(recording);
  await set('recordings_list', all);
}

export async function deleteRecording(recordingId: string): Promise<void> {
  const all = (await get('recordings_list') || []).filter((r: any) => r.id !== recordingId);
  await set('recordings_list', all);
}

export async function getAllRecordings(): Promise<any[]> {
  return (await get('recordings_list')) || [];
}

export async function clearRecordings(): Promise<void> {
  await set('recordings_list', []);
}

// --- Call history operations ---

export async function addCallHistoryEntry(entry: any): Promise<void> {
  const all = (await get('call_history_list') || []);
  all.push(entry);
  await set('call_history_list', all);
}

export async function getAllCallHistory(): Promise<any[]> {
  const all = await get('call_history_list') || [];
  return all.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

export async function clearCallHistory(): Promise<void> {
  await set('call_history_list', []);
}

// --- Company message operations ---

export async function addCompanyMessage(msg: any): Promise<void> {
  const all = (await get('company_msgs_list') || []);
  all.push(msg);
  await set('company_msgs_list', all);
}

export async function getAllCompanyMessages(): Promise<any[]> {
  return (await get('company_msgs_list')) || [];
}

// --- Company settings operations ---

export async function saveCompanySettings(settings: Record<string, string>): Promise<void> {
  await set(STORAGE_KEYS.COMPANY_SETTINGS, settings);
}

export async function getCompanySettings(): Promise<Record<string, string> | null> {
  const data = await get(STORAGE_KEYS.COMPANY_SETTINGS);
  return data || null;
}

// --- Bulk reset ---

export async function clearAll(): Promise<void> {
  await clear();
}

export async function reset(): Promise<void> {
  await clearAll();
}

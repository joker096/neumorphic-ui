import { STORAGE_KEYS } from '../constants/storage';
import type { CompanyMember } from '../lib/company/types';
import type { EncryptedPayload } from './crypto/types';
import { set, get } from './idbCore';

// --- Company metadata: encrypted at rest (device-bound AES-256-GCM) ---

/**
 * Company metadata is encrypted at rest. Fail **closed**: if the device-bound
 * key or the cipher is unavailable, the write must fail rather than silently
 * downgrade to plaintext (the previous `catch { return value }` wrote the
 * plaintext company settings/members/contacts/deals straight into IndexedDB).
 */
async function encBlob(value: unknown): Promise<unknown> {
  const { encryptCrmData } = await import('./crm/atRest');
  return encryptCrmData(JSON.stringify(value));
}

async function decBlob<T>(raw: unknown): Promise<T | null> {
  if (raw == null) return null;
  const { isEncryptedPayload, decryptCrmData } = await import('./crm/atRest');
  if (isEncryptedPayload(raw)) {
    try {
      return JSON.parse(await decryptCrmData(raw as EncryptedPayload)) as T;
    } catch {
      return null;
    }
  }
  return raw as T;
}

export async function saveCompanySettings(settings: Record<string, string>): Promise<void> {
  await set(STORAGE_KEYS.COMPANY_SETTINGS, await encBlob(settings));
}

export async function getCompanySettings(): Promise<Record<string, string> | null> {
  return decBlob<Record<string, string>>(await get(STORAGE_KEYS.COMPANY_SETTINGS));
}

export async function saveCompanyId(id: string): Promise<void> {
  await set(STORAGE_KEYS.COMPANY_ID, id);
}

export async function getCompanyId(): Promise<string | null> {
  const data = await get(STORAGE_KEYS.COMPANY_ID);
  return typeof data === 'string' ? data : null;
}

export async function saveCompanyMembers(members: CompanyMember[]): Promise<void> {
  await set(STORAGE_KEYS.COMPANY_MEMBERS, await encBlob(members));
}

export async function getCompanyMembers(): Promise<CompanyMember[] | null> {
  return decBlob<CompanyMember[]>(await get(STORAGE_KEYS.COMPANY_MEMBERS));
}

// --- Company departments ---

export async function saveCompanyDepartments(departments: any[]): Promise<void> {
  await set(STORAGE_KEYS.COMPANY_DEPARTMENTS, await encBlob(departments));
}

export async function getCompanyDepartments(): Promise<any[] | null> {
  return decBlob<any[]>(await get(STORAGE_KEYS.COMPANY_DEPARTMENTS));
}

// --- Company contacts ---

export async function saveCompanyContacts(contacts: any[]): Promise<void> {
  await set(STORAGE_KEYS.COMPANY_CONTACTS, await encBlob(contacts));
}

export async function getCompanyContacts(): Promise<any[] | null> {
  return decBlob<any[]>(await get(STORAGE_KEYS.COMPANY_CONTACTS));
}

// --- Company group key (raw base64, encrypted at rest) ---

export async function saveCompanyGroupKey(companyId: string, rawB64: string): Promise<void> {
  await set(`company_groupkey_${companyId}`, await encBlob(rawB64));
}

export async function getCompanyGroupKey(companyId: string): Promise<string | null> {
  const data = await decBlob<string>(await get<string>(`company_groupkey_${companyId}`));
  return typeof data === 'string' ? data : null;
}

// --- Company channels ---

export async function saveCompanyChannels(channels: any[]): Promise<void> {
  await set(STORAGE_KEYS.COMPANY_CHANNELS, await encBlob(channels));
}

export async function getCompanyChannels(): Promise<any[] | null> {
  return decBlob<any[]>(await get(STORAGE_KEYS.COMPANY_CHANNELS));
}

// --- Company CRM sync envelopes ---

export async function saveCompanyCrmEnvelopes(envelopes: any[]): Promise<void> {
  await set('company_crm_sync_envelopes', await encBlob(envelopes));
}

export async function getCompanyCrmEnvelopes(): Promise<any[] | null> {
  return decBlob<any[]>(await get('company_crm_sync_envelopes'));
}

// --- Company channel keys + site chats (encrypted at rest) ---

export async function saveCompanyChannelKeys(
  keys: Record<string, { publicKeyB64: string; secretKeyB64: string }>,
): Promise<void> {
  await set('company_channel_keys', await encBlob(keys));
}

export async function getCompanyChannelKeys(): Promise<
  Record<string, { publicKeyB64: string; secretKeyB64: string }> | null
> {
  return decBlob<Record<string, { publicKeyB64: string; secretKeyB64: string }>>(
    await get('company_channel_keys'),
  );
}

export async function saveCompanySiteChats(chats: any[]): Promise<void> {
  await set('company_site_chats', await encBlob(chats));
}

export async function getCompanySiteChats(): Promise<any[] | null> {
  return decBlob<any[]>(await get('company_site_chats'));
}

export async function saveCompanyWebsiteContacts(contacts: any[]): Promise<void> {
  await set('company_website_contacts', await encBlob(contacts));
}

export async function getCompanyWebsiteContacts(): Promise<any[] | null> {
  return decBlob<any[]>(await get('company_website_contacts'));
}

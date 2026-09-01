import { useAppStore, markDataHydrated } from '../store';
import { CRM_STORAGE_KEY, saveCrmPersisted } from '../store/slices/crmSlice';
import { STORAGE_KEYS } from '../constants/storage';
import * as idb from './idb';
import { saveMembers } from './company/companyUser';
import { decryptBackupData, encryptBackupData, isEncryptedBackup } from './backupCrypto';
import type { Contact } from '../types/contact';
import type { P2PChannel } from '../store/types';
import type {
  CompanyChannel, CompanyContact, CompanyDepartment, CompanyMessage, CompanyMember,
} from '../types/constants';
import type { CrmContact, CrmTask, CustomRole, Deal, Department } from './crm/types';
import type { CallHistoryEntry } from '../store/slices/callSlice';

export type { CallHistoryEntry };

export interface CompanyBackup {
  companyId: string | null;
  companySettings: {
    name: string;
    logo?: string;
    phone?: string;
    email?: string;
    address?: string;
    website?: string;
    taxId?: string;
  } | null;
  companyMembers: CompanyMember[];
  companyChannels: CompanyChannel[];
  companyMessages: CompanyMessage[];
  companyDepartments: CompanyDepartment[];
  companyContacts: CompanyContact[];
}

export interface CrmBackup {
  contacts: CrmContact[];
  departments: Department[];
  customRoles: CustomRole[];
  deals: Deal[];
  tasks: CrmTask[];
}

export interface BackupData {
  version: 1;
  app: 'neumorphic-ui';
  createdAt: string;
  chats: any[];
  contacts: Contact[];
  channels: P2PChannel[];
  callHistory: CallHistoryEntry[];
  company: CompanyBackup;
  crm: CrmBackup;
}

export const LAST_BACKUP_KEY = 'app_last_backup_at';

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function collectBackup(): BackupData {
  const s = useAppStore.getState();
  return {
    version: 1,
    app: 'neumorphic-ui',
    createdAt: new Date().toISOString(),
    chats: s.chats,
    contacts: s.contacts,
    channels: s.channels,
    callHistory: s.callHistory,
    company: {
      companyId: s.companyId,
      companySettings: s.companySettings,
      companyMembers: s.companyMembers,
      companyChannels: s.companyChannels,
      companyMessages: s.companyMessages,
      companyDepartments: s.companyDepartments,
      companyContacts: s.companyContacts,
    },
    crm: {
      contacts: s.crmContacts,
      departments: s.crmDepartments,
      customRoles: s.crmCustomRoles,
      deals: s.crmDeals,
      tasks: s.crmTasks,
    },
  };
}

export function normalizeBackup(raw: unknown): BackupData {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Invalid backup file');
  }
  const obj = raw as Record<string, any>;
  const company = (obj.company && typeof obj.company === 'object' ? obj.company : {}) as Record<string, any>;
  const crm = (obj.crm && typeof obj.crm === 'object' ? obj.crm : {}) as Record<string, any>;
  return {
    version: 1,
    app: 'neumorphic-ui',
    createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : new Date().toISOString(),
    chats: asArray(obj.chats),
    contacts: asArray(obj.contacts),
    channels: asArray(obj.channels),
    callHistory: asArray(obj.callHistory),
    company: {
      companyId: typeof company.companyId === 'string' ? company.companyId : null,
      companySettings: company.companySettings ?? null,
      companyMembers: asArray<CompanyMember>(company.companyMembers),
      companyChannels: asArray<CompanyChannel>(company.companyChannels),
      companyMessages: asArray<CompanyMessage>(company.companyMessages),
      companyDepartments: asArray<CompanyDepartment>(company.companyDepartments),
      companyContacts: asArray<CompanyContact>(company.companyContacts),
    },
    crm: {
      contacts: asArray<CrmContact>(crm.contacts),
      departments: asArray<Department>(crm.departments),
      customRoles: asArray<CustomRole>(crm.customRoles),
      deals: asArray<Deal>(crm.deals),
      tasks: asArray<CrmTask>(crm.tasks),
    },
  };
}

export async function parseBackupFile(file: File): Promise<BackupData> {
  const text = await file.text();
  const parsed = JSON.parse(text);
  return normalizeBackup(parsed);
}

export async function decryptBackupFile(file: File, password: string): Promise<BackupData> {
  const buf = await file.arrayBuffer();
  if (!isEncryptedBackup(buf)) throw new Error('Invalid backup file');
  const parsed = await decryptBackupData(buf, password);
  return normalizeBackup(parsed);
}

function downloadFile(filename: string, bytes: Uint8Array): void {
  const blob = new Blob([bytes], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

const dateStamp = (): string => new Date().toISOString().slice(0, 10);

export async function downloadBackup(password: string): Promise<BackupData> {
  const data = collectBackup();
  downloadFile(`neumorphic-backup-${dateStamp()}.enc`, await encryptBackupData(data, password));
  return data;
}

export async function downloadChatsExport(password: string): Promise<void> {
  const s = useAppStore.getState();
  const bytes = await encryptBackupData(
    { chats: s.chats, callHistory: s.callHistory },
    password,
  );
  downloadFile(`neumorphic-chats-${dateStamp()}.enc`, bytes);
}

export interface CrmMigrationBundle {
  version: 1;
  app: 'neumorphic-ui';
  kind: 'crm';
  createdAt: string;
  crm: CrmBackup;
}

function normalizeCrmBundle(raw: unknown): CrmMigrationBundle {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Invalid CRM bundle file');
  }
  const obj = raw as Record<string, any>;
  const crm = (obj.crm && typeof obj.crm === 'object' ? obj.crm : {}) as Record<string, any>;
  return {
    version: 1,
    app: 'neumorphic-ui',
    kind: 'crm',
    createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : new Date().toISOString(),
    crm: {
      contacts: asArray<CrmContact>(crm.contacts),
      departments: asArray<Department>(crm.departments),
      customRoles: asArray<CustomRole>(crm.customRoles),
      deals: asArray<Deal>(crm.deals),
      tasks: asArray<CrmTask>(crm.tasks),
    },
  };
}

/** Export only the CRM portion as an encrypted migration bundle. */
export async function downloadCrmMigrationBundle(password: string): Promise<CrmMigrationBundle> {
  const bundle: CrmMigrationBundle = {
    version: 1,
    app: 'neumorphic-ui',
    kind: 'crm',
    createdAt: new Date().toISOString(),
    crm: collectBackup().crm,
  };
  downloadFile(`neumorphic-crm-${dateStamp()}.enc`, await encryptBackupData(bundle, password));
  return bundle;
}

export async function parseCrmMigrationFile(file: File): Promise<CrmMigrationBundle> {
  const parsed = JSON.parse(await file.text());
  return normalizeCrmBundle(parsed);
}

export async function decryptCrmMigrationFile(file: File, password: string): Promise<CrmMigrationBundle> {
  const buf = await file.arrayBuffer();
  if (!isEncryptedBackup(buf)) throw new Error('Invalid CRM bundle file');
  const parsed = await decryptBackupData(buf, password);
  return normalizeCrmBundle(parsed);
}

export interface CrmMergeResult {
  added: number;
  updated: number;
}

function mergeById<T extends { id: string }>(base: T[], add: T[]): { out: T[]; added: number; updated: number } {
  const map = new Map<string, T>();
  let added = 0;
  let updated = 0;
  for (const b of base) map.set(b.id, b);
  for (const a of add) {
    if (map.has(a.id)) {
      map.set(a.id, a);
      updated += 1;
    } else {
      map.set(a.id, a);
      added += 1;
    }
  }
  return { out: Array.from(map.values()), added, updated };
}

/** Merge a CRM migration bundle into the current CRM store (no full-app replace). */
export function mergeCrmBundle(bundle: CrmMigrationBundle): CrmMergeResult {
  const s = useAppStore.getState();
  const incoming = bundle.crm;

  const cMap = new Map<string, CrmContact>();
  for (const c of s.crmContacts) cMap.set(c.userId, c);
  let cAdded = 0;
  let cUpdated = 0;
  for (const c of incoming.contacts) {
    if (cMap.has(c.userId)) {
      cMap.set(c.userId, c);
      cUpdated += 1;
    } else {
      cMap.set(c.userId, c);
      cAdded += 1;
    }
  }
  const contacts = Array.from(cMap.values());
  const dep = mergeById(s.crmDepartments, incoming.departments);
  const role = mergeById(s.crmCustomRoles, incoming.customRoles);
  const deal = mergeById(s.crmDeals, incoming.deals);
  const task = mergeById(s.crmTasks, incoming.tasks);

  useAppStore.setState({
    crmContacts: contacts,
    crmDepartments: dep.out,
    crmCustomRoles: role.out,
    crmDeals: deal.out,
    crmTasks: task.out,
    crmLoaded: true,
  });
  void saveCrmPersisted({
    crmContacts: contacts,
    crmDepartments: dep.out,
    crmCustomRoles: role.out,
    crmDeals: deal.out,
    crmTasks: task.out,
  }).catch(() => {});

  return {
    added: cAdded + dep.added + role.added + deal.added + task.added,
    updated: cUpdated + dep.updated + role.updated + deal.updated + task.updated,
  };
}

export async function applyBackup(data: BackupData): Promise<void> {
  markDataHydrated();
  const { company, crm } = data;

  useAppStore.setState({
    chats: data.chats,
    contacts: data.contacts,
    channels: data.channels,
    callHistory: data.callHistory,
    companyId: company.companyId,
    companySettings: company.companySettings,
    companyMembers: company.companyMembers,
    companyChannels: company.companyChannels,
    companyMessages: company.companyMessages,
    companyDepartments: company.companyDepartments,
    companyContacts: company.companyContacts,
    crmContacts: crm.contacts,
    crmDepartments: crm.departments,
    crmCustomRoles: crm.customRoles,
    crmDeals: crm.deals,
    crmTasks: crm.tasks,
    crmLoaded: true,
  });

  await idb.set('chats_all', data.chats);
  await idb.set('contacts_all', data.contacts);
  await idb.set('channels_all', data.channels);
  await idb.set('call_history_all', data.callHistory);
  await idb.set('company_msgs_list', company.companyMessages);
  if (company.companyId) {
    await idb.saveCompanyId(company.companyId);
  } else {
    await idb.del(STORAGE_KEYS.COMPANY_ID);
  }
  if (company.companySettings) {
    await idb.saveCompanySettings(company.companySettings as unknown as Record<string, string>);
  } else {
    await idb.del(STORAGE_KEYS.COMPANY_SETTINGS);
  }
  await saveMembers(company.companyMembers);
  await idb.saveCompanyDepartments(company.companyDepartments);
  await idb.saveCompanyContacts(company.companyContacts);
  void saveCrmPersisted({
    crmContacts: crm.contacts,
    crmDepartments: crm.departments,
    crmCustomRoles: crm.customRoles,
    crmDeals: crm.deals,
    crmTasks: crm.tasks,
  }).catch(() => {});
}

const DATA_KEY_PREFIXES = ['chat:', 'contact:', 'channel:'];
const DATA_KEY_EXACT = [
  'chats_list', 'chats_all',
  'contacts_list', 'contacts_all',
  'channels_list', 'channels_all',
  'bots_list', 'scheduled_list', 'recordings_list',
  'call_history_list', 'call_history_all',
  'company_msgs_list',
  STORAGE_KEYS.COMPANY_SETTINGS,
  STORAGE_KEYS.COMPANY_ID,
  STORAGE_KEYS.COMPANY_MEMBERS,
  STORAGE_KEYS.COMPANY_DEPARTMENTS,
  STORAGE_KEYS.COMPANY_CONTACTS,
];

const LOCAL_DATA_KEYS = [
  STORAGE_KEYS.DRAFTS,
  STORAGE_KEYS.SAVED_MESSAGES,
  CRM_STORAGE_KEY,
];

export async function clearLocalCache(): Promise<void> {
  markDataHydrated();

  const allKeys = await idb.keys();
  for (const key of allKeys) {
    const isDataKey =
      DATA_KEY_EXACT.includes(key) ||
      DATA_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
    if (isDataKey) {
      await idb.del(key);
    }
  }
  for (const key of LOCAL_DATA_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* storage unavailable */
    }
  }

  useAppStore.setState({
    chats: [],
    contacts: [],
    channels: [],
    callHistory: [],
    companyId: null,
    companySettings: null,
    companyMembers: [],
    companyChannels: [],
    companyMessages: [],
    companyDepartments: [],
    companyContacts: [],
    crmContacts: [],
    crmDepartments: [],
    crmCustomRoles: [],
    crmDeals: [],
    crmTasks: [],
  });
  void saveCrmPersisted({
    crmContacts: [],
    crmDepartments: [],
    crmCustomRoles: [],
    crmDeals: [],
    crmTasks: [],
  }).catch(() => {});
  useAppStore.getState().leaveCompanyChannel();
}

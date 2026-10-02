import { useAppStore, markDataHydrated } from '../store';
import { CRM_STORAGE_KEY, saveCrmPersisted } from '../store/slices/crmSlice';
import { STORAGE_KEYS } from '../constants/storage';
import * as idb from './idb';
import { asArray, dateStamp, downloadFile } from './backupIO';
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

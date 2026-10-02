import { useAppStore } from '../store';
import { saveCrmPersisted } from '../store/slices/crmSlice';
import { decryptBackupData, encryptBackupData, isEncryptedBackup } from './backupCrypto';
import type { CrmContact, CrmTask, CustomRole, Deal, Department } from './crm/types';
import { collectBackup, type CrmBackup } from './backup';
import { asArray, dateStamp, downloadFile } from './backupIO';

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

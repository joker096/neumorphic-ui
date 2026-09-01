/**
 * Local-first public SDK for Mess&Anger CRM.
 *
 * Exposes a typed `window.MessAnger` surface so third-party mini-apps and
 * power users can drive CRM operations WITHOUT any cloud round-trip or
 * telemetry. Every call operates on the local encrypted store.
 */

import { useAppStore } from '../store';
import { importFromText } from './crm/import';
import { syncMessengerContacts } from './crm/bridge';
import { computeCrmAnalytics } from './crm/analytics';
import { downloadCrmMigrationBundle } from './backup';
import type { CrmContact, Deal, CrmTask } from './crm/types';
import type { Contact } from '../types/contact';

const VERSION = '1.0.0';

export interface MessAngerImportOpts {
  defaultOwnerId?: string;
  currency?: string;
  skipDuplicates?: boolean;
}

export interface MessAngerSdk {
  version: string;
  /** Auto-detects CSV/JSON from content. */
  importText: (text: string, opts?: MessAngerImportOpts) => Promise<{ imported: number; issues: number }>;
  importCsv: (text: string, opts?: MessAngerImportOpts) => Promise<{ imported: number; issues: number }>;
  importJson: (text: string, opts?: MessAngerImportOpts) => Promise<{ imported: number; issues: number }>;
  exportBundle: (password?: string) => Promise<void>;
  getContacts: () => CrmContact[];
  getDeals: () => Deal[];
  getTasks: () => CrmTask[];
  getAnalytics: (readStats?: { sent: number; read: number }) => ReturnType<typeof computeCrmAnalytics>;
  syncMessenger: (contacts: Contact[]) => { added: number; updated: number };
}

let installed = false;

export function createMessAngerSdk(): MessAngerSdk {
  const store = () => useAppStore.getState();
  const run = (text: string, hint?: 'csv' | 'json') => {
    const { result } = importFromText(text, hint ? { formatHint: hint } : undefined);
    store().importBatch(result);
    return { imported: result.contacts.length, issues: result.issues.length };
  };
  return {
    version: VERSION,
    importText: (text, opts) => Promise.resolve(run(text)),
    importCsv: (text, opts) => Promise.resolve(run(text, 'csv')),
    importJson: (text, opts) => Promise.resolve(run(text, 'json')),
    exportBundle: (password) => downloadCrmMigrationBundle(password).then(() => undefined),
    getContacts: () => store().crmContacts,
    getDeals: () => store().crmDeals,
    getTasks: () => store().crmTasks,
    getAnalytics: (readStats) => {
      const s = store();
      return computeCrmAnalytics(s.crmContacts, s.crmDeals, s.crmTasks, readStats);
    },
    syncMessenger: (contacts) => {
      const res = syncMessengerContacts(store().crmContacts, contacts);
      store().syncMessengerContacts(contacts);
      return { added: res.added.length, updated: res.updated.length };
    },
  };
}

/** Install `window.MessAnger` exactly once. Safe to call repeatedly. */
export function installMessAngerSdk(): void {
  if (installed || typeof window === 'undefined') return;
  (window as unknown as { MessAnger?: MessAngerSdk }).MessAnger = createMessAngerSdk();
  installed = true;
}

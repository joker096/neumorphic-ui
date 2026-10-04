import type {
  CrmContact,
  CrmContactStatus,
  CrmTask,
  Deal,
  DealStage,
  SystemRole,
  TaskPriority,
} from './types';

/**
 * Public types of the CRM importer (re-exported from `./import`, so existing
 * import sites keep working).
 */

export type ImportFormat = 'csv' | 'json';

export interface RawRecord {
  [key: string]: string;
}

export type ImportIssueCode =
  | 'unknown-status'
  | 'unknown-stage'
  | 'unknown-priority'
  | 'row-skipped';

export interface ImportIssue {
  row: number;
  field?: string;
  code: ImportIssueCode;
  value?: string;
  severity: 'error' | 'warning';
}

export interface DraftContact {
  displayName: string;
  phone?: string;
  email?: string;
  status: CrmContactStatus;
  tags: string[];
  title?: string;
  notes?: string;
  role: SystemRole;
}

export interface DraftDeal {
  title: string;
  contactRef?: string;
  stage: DealStage;
  amount: number;
  currency: string;
  notes?: string;
  expectedClose?: number | null;
}

export interface DraftTask {
  title: string;
  contactRef?: string;
  dealRef?: string;
  priority: TaskPriority;
  due?: string;
  done: boolean;
}

export interface ImportPlan {
  contacts: DraftContact[];
  deals: DraftDeal[];
  tasks: DraftTask[];
  issues: ImportIssue[];
  stats: { contacts: number; deals: number; tasks: number; errors: number; warnings: number };
}

export interface ImportOptions {
  defaultOwnerId?: string;
  defaultCurrency?: string;
  existingContacts?: CrmContact[];
  skipDuplicates?: boolean;
  formatHint?: ImportFormat;
  source?: string;
}

export interface ImportResult {
  contacts: CrmContact[];
  mergedContacts: CrmContact[];
  deals: Deal[];
  tasks: CrmTask[];
  issues: ImportIssue[];
  stats: {
    importedContacts: number;
    mergedContacts: number;
    importedDeals: number;
    importedTasks: number;
    duplicatesSkipped: number;
    errors: number;
    warnings: number;
  };
}
import type {
  CrmContact, Department, CustomRole, Deal, CrmTask, CrmFilters,
  CrmPermission, SystemRole, CrmContactStatus, DealStage,
} from '../../lib/crm/types';
import type { Contact } from '../../types/contact';
import { DEFAULT_CRM_FILTERS } from '../../lib/crm/types';
import { createCrmLifecycleActions } from './crm/crmLifecycleActions';
import { createCrmContactActions } from './crm/crmContactActions';
import { createCrmDirectoryActions } from './crm/crmDirectoryActions';
import { createCrmDealActions } from './crm/crmDealActions';
import { createCrmTaskActions } from './crm/crmTaskActions';
import { createCrmFilterActions } from './crm/crmFilterActions';

export {
  CRM_STORAGE_KEY,
  loadCrmPersisted,
  saveCrmPersisted,
} from './crm/crmPersist';
export { resolvePermissions } from './crm/crmShared';

export interface CrmSlice {
  crmContacts: CrmContact[];
  crmDepartments: Department[];
  crmCustomRoles: CustomRole[];
  crmDeals: Deal[];
  crmTasks: CrmTask[];
  crmFilters: CrmFilters;
  crmLoaded: boolean;
  crmCollapsedGroups: string[];
  crmInviteCode: string;

  // lifecycle
  ensureCrmSeed: (currentUserId: string, currentUserName: string) => Promise<void>;
  resetCrmDemo: (currentUserId: string, currentUserName: string) => void;
  ensureCrmInviteCode: () => string;
  importBatch: (data: { contacts: CrmContact[]; deals: Deal[]; tasks: CrmTask[]; mergedContacts?: CrmContact[] }) => void;
  syncMessengerContacts: (messenger: Contact[]) => { added: CrmContact[]; updated: CrmContact[] };

  // contacts
  addContact: (contact: Omit<CrmContact, 'userId' | 'tags' | 'status'> & Partial<Pick<CrmContact, 'tags' | 'status'>>) => void;
  updateContact: (userId: string, patch: Partial<CrmContact>) => void;
  removeContact: (userId: string) => void;
  setContactRole: (userId: string, role: SystemRole, customRoleId?: string | null) => void;
  assignManager: (userId: string, managerId: string | null) => void;
  setContactStatus: (userId: string, status: CrmContactStatus) => void;
  addContactTag: (userId: string, tag: string) => void;
  removeContactTag: (userId: string, tag: string) => void;

  // departments
  addDepartment: (name: string, color: string) => void;
  updateDepartment: (id: string, patch: Partial<Department>) => void;
  removeDepartment: (id: string) => void;

  // custom roles
  addCustomRole: (name: string) => void;
  updateCustomRole: (id: string, patch: Partial<CustomRole>) => void;
  toggleCustomRolePermission: (id: string, perm: CrmPermission) => void;
  removeCustomRole: (id: string) => void;

  // deals
  addDeal: (deal: Omit<Deal, 'id' | 'createdAt'>) => void;
  updateDeal: (id: string, patch: Partial<Deal>) => void;
  setDealStage: (id: string, stage: DealStage) => void;
  removeDeal: (id: string) => void;

  // tasks
  addTask: (task: Omit<CrmTask, 'id' | 'createdAt' | 'done'> & Partial<Pick<CrmTask, 'done'>>) => void;
  updateTask: (id: string, patch: Partial<CrmTask>) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;

  // filters
  setCrmFilter: <K extends keyof CrmFilters>(key: K, value: CrmFilters[K]) => void;
  resetCrmFilters: () => void;

  // people groups
  toggleCrmGroup: (key: string) => void;
}

export const createCrmSlice = (set: any, get: any): CrmSlice => ({
  crmContacts: [],
  crmDepartments: [],
  crmCustomRoles: [],
  crmDeals: [],
  crmTasks: [],
  crmFilters: { ...DEFAULT_CRM_FILTERS },
  crmLoaded: false,
  crmCollapsedGroups: [],
  crmInviteCode: '',

  ...createCrmLifecycleActions(set, get),
  ...createCrmContactActions(set),
  ...createCrmDirectoryActions(set),
  ...createCrmDealActions(set),
  ...createCrmTaskActions(set),
  ...createCrmFilterActions(set),
});
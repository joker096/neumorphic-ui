/**
 * CRM domain model.
 *
 * Extends the company member concept into a full contact-management layer:
 * granular roles (admin / manager / member + custom roles with permission sets),
 * departments, client-manager assignment, deals pipeline and tasks.
 */

export type CrmPermission =
  | 'viewAll' // see every contact / deal / task
  | 'manageMembers' // add / edit / remove people
  | 'manageDepartments' // create & edit departments
  | 'manageRoles' // create & edit custom roles and permissions
  | 'manageCompany' // edit company profile / settings
  | 'manageDeals' // create / edit / delete deals
  | 'manageTasks' // create / edit / delete tasks
  | 'assignManagers'; // assign account managers to contacts

export type SystemRole = 'admin' | 'manager' | 'member';

export type CrmContactStatus =
  | 'lead'
  | 'client'
  | 'partner'
  | 'vendor'
  | 'internal'
  | 'vip';

/** Origin of a CRM contact — 'website' = imported from an embedded site chat. */
export type CrmContactSource = 'personal' | 'business' | 'website';

/** Tag prefix attached to website-imported contacts (e.g. `site:example.com`). */
export const SITE_CONTACT_TAG_PREFIX = 'site:';

export function siteContactTag(domain: string): string {
  return `${SITE_CONTACT_TAG_PREFIX}${domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')}`;
}

export interface Department {
  id: string;
  name: string;
  color: string; // tailwind gradient class
  leadId?: string | null;
}

export interface CustomRole {
  id: string;
  name: string;
  permissions: CrmPermission[];
}

export interface CrmContact {
  userId: string;
  displayName: string;
  role: SystemRole;
  customRoleId?: string | null;
  departmentId?: string | null;
  title?: string; // job title / position
  phone?: string;
  email?: string;
  tags: string[];
  notes?: string;
  status: CrmContactStatus;
  assignedManagerId?: string | null; // account manager responsible for this client
  online?: boolean;
  avatarColor?: string;
  joinedAt?: number;
  lastActive?: number;
  /** 'website' = visitor imported from an embedded site chat. */
  source?: CrmContactSource;
  websiteDomain?: string;
}

export type DealStage =
  | 'new'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost';

export interface Deal {
  id: string;
  title: string;
  contactId: string;
  stage: DealStage;
  amount: number;
  currency: string;
  ownerId: string; // responsible user
  expectedClose?: number | null;
  createdAt: number;
  notes?: string;
}

export type TaskPriority = 'low' | 'medium' | 'high';

export interface CrmTask {
  id: string;
  title: string;
  done: boolean;
  priority: TaskPriority;
  dueAt?: number | null;
  assigneeId?: string | null;
  contactId?: string | null;
  dealId?: string | null;
  createdAt: number;
}

export interface CrmFilters {
  search: string;
  role: SystemRole | 'all';
  departmentId: string | 'all';
  status: CrmContactStatus | 'all';
  tag: string | 'all';
  assignedToMe: boolean;
}

export type CrmFocusKind = 'people' | 'deals' | 'tasks';

export const DEFAULT_CRM_FILTERS: CrmFilters = {
  search: '',
  role: 'all',
  departmentId: 'all',
  status: 'all',
  tag: 'all',
  assignedToMe: false,
};

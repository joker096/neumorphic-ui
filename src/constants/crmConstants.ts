/**
 * CRM UI constants: stage/status definitions, permission metadata, avatar
 * gradients and i18n fallback copy. Keeps components free of magic values.
 */

import type { CrmPermission, DealStage, CrmContactStatus, SystemRole } from '../lib/crm/types';

export const CRM_AVATAR_GRADIENTS = [
  'from-indigo-400 to-purple-500',
  'from-pink-400 to-rose-500',
  'from-yellow-400 to-orange-500',
  'from-teal-400 to-cyan-500',
  'from-emerald-400 to-green-500',
  'from-sky-400 to-blue-500',
] as const;

export const crmAvatarAt = (index: number): string =>
  CRM_AVATAR_GRADIENTS[index % CRM_AVATAR_GRADIENTS.length];

export const DEAL_STAGES: { id: DealStage; labelKey: string; gradient: string }[] = [
  { id: 'new', labelKey: 'crm.stageNew', gradient: 'from-slate-400 to-slate-500' },
  { id: 'qualified', labelKey: 'crm.stageQualified', gradient: 'from-sky-400 to-blue-500' },
  { id: 'proposal', labelKey: 'crm.stageProposal', gradient: 'from-violet-400 to-purple-500' },
  { id: 'negotiation', labelKey: 'crm.stageNegotiation', gradient: 'from-amber-400 to-orange-500' },
  { id: 'won', labelKey: 'crm.stageWon', gradient: 'from-emerald-400 to-green-500' },
  { id: 'lost', labelKey: 'crm.stageLost', gradient: 'from-rose-400 to-red-500' },
];

export const CONTACT_STATUSES: { id: CrmContactStatus; labelKey: string }[] = [
  { id: 'lead', labelKey: 'crm.statusLead' },
  { id: 'client', labelKey: 'crm.statusClient' },
  { id: 'partner', labelKey: 'crm.statusPartner' },
  { id: 'vendor', labelKey: 'crm.statusVendor' },
  { id: 'internal', labelKey: 'crm.statusInternal' },
  { id: 'vip', labelKey: 'crm.statusVip' },
];

export const SYSTEM_ROLES: { id: SystemRole; labelKey: string }[] = [
  { id: 'admin', labelKey: 'crm.roleAdmin' },
  { id: 'manager', labelKey: 'crm.roleManager' },
  { id: 'member', labelKey: 'crm.roleMember' },
];

export const PERMISSION_META: { id: CrmPermission; labelKey: string; descriptionKey: string }[] = [
  { id: 'viewAll', labelKey: 'crm.permViewAll', descriptionKey: 'crm.permViewAllDesc' },
  { id: 'manageMembers', labelKey: 'crm.permManageMembers', descriptionKey: 'crm.permManageMembersDesc' },
  { id: 'manageDepartments', labelKey: 'crm.permManageDepartments', descriptionKey: 'crm.permManageDepartmentsDesc' },
  { id: 'manageRoles', labelKey: 'crm.permManageRoles', descriptionKey: 'crm.permManageRolesDesc' },
  { id: 'manageCompany', labelKey: 'crm.permManageCompany', descriptionKey: 'crm.permManageCompanyDesc' },
  { id: 'manageDeals', labelKey: 'crm.permManageDeals', descriptionKey: 'crm.permManageDealsDesc' },
  { id: 'manageTasks', labelKey: 'crm.permManageTasks', descriptionKey: 'crm.permManageTasksDesc' },
  { id: 'assignManagers', labelKey: 'crm.permAssignManagers', descriptionKey: 'crm.permAssignManagersDesc' },
];

/** Default permission sets per system role. */
export const SYSTEM_ROLE_PERMISSIONS: Record<SystemRole, CrmPermission[]> = {
  admin: [
    'viewAll', 'manageMembers', 'manageDepartments', 'manageRoles', 'manageCompany',
    'manageDeals', 'manageTasks', 'assignManagers',
  ],
  manager: ['viewAll', 'manageMembers', 'manageDeals', 'manageTasks', 'assignManagers'],
  member: ['viewAll'],
};

export const CRM_FALLBACKS = {
  title: 'CRM',
  tabPeople: 'People',
  tabDeals: 'Deals',
  tabTasks: 'Tasks',
  tabRoles: 'Roles',
  search: 'Search contacts...',
  all: 'All',
  noContacts: 'No contacts match the filters',
  addContact: 'Add contact',
  addDeal: 'Add deal',
  addTask: 'Add task',
  noDeals: 'No deals yet',
  noTasks: 'No tasks yet',
  filter: 'Filter',
  manageCategories: 'Manage departments',
  resetDemo: 'Reset demo data',
  demoReset: 'Demo data restored',
  demoNote: 'Contacts you add are your own data and are saved in this browser.',
  role: 'Role',
  department: 'Department',
  status: 'Status',
  tag: 'Tag',
  assignedToMe: 'Assigned to me',
  // contact card
  editContact: 'Edit contact',
  newContact: 'New contact',
  fullName: 'Full name',
  jobTitle: 'Job title',
  phone: 'Phone',
  email: 'Email',
  notes: 'Notes',
  tagsPlaceholder: 'Add tag and press Enter',
  manager: 'Account manager',
  save: 'Save',
  cancel: 'Cancel',
  remove: 'Remove',
  youCantRemoveSelf: 'You cannot remove yourself',
  // roles
  departments: 'Departments',
  addDepartment: 'Add department',
  customRoles: 'Custom roles',
  addRole: 'Add role',
  permissions: 'Permissions',
  roleName: 'Role name',
  departmentLead: 'Department lead',
  // deals
  dealTitle: 'Deal title',
  amount: 'Amount',
  stage: 'Stage',
  owner: 'Owner',
  expectedClose: 'Expected close',
  // tasks
  taskTitle: 'Task',
  priority: 'Priority',
  due: 'Due',
  assignee: 'Assignee',
  markDone: 'Mark done',
  // statuses / stages labels
  stageNew: 'New',
  stageQualified: 'Qualified',
  stageProposal: 'Proposal',
  stageNegotiation: 'Negotiation',
  stageWon: 'Won',
  stageLost: 'Lost',
  statusLead: 'Lead',
  statusClient: 'Client',
  statusPartner: 'Partner',
  statusVendor: 'Vendor',
  statusInternal: 'Internal',
  statusVip: 'VIP',
  roleAdmin: 'Admin',
  roleManager: 'Manager',
  roleMember: 'Member',
  // permissions
  permViewAll: 'View all',
  permViewAllDesc: 'See every contact, deal and task',
  permManageMembers: 'Manage people',
  permManageMembersDesc: 'Add, edit and remove people',
  permManageDepartments: 'Manage departments',
  permManageDepartmentsDesc: 'Create and edit departments',
  permManageRoles: 'Manage roles',
  permManageRolesDesc: 'Create and edit custom roles and permissions',
  permManageCompany: 'Manage company',
  permManageCompanyDesc: 'Edit company profile and settings',
  permManageDeals: 'Manage deals',
  permManageDealsDesc: 'Create and edit deals',
  permManageTasks: 'Manage tasks',
  permManageTasksDesc: 'Create and edit tasks',
  permAssignManagers: 'Assign managers',
  permAssignManagersDesc: 'Assign account managers to contacts',
  // access
  noAccess: 'You do not have permission to do this',
} as const;

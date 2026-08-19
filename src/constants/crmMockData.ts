/**
 * Seed CRM data used as a demo dataset (mock mode) until real data is loaded.
 */

import type {
  CrmContact, Department, CustomRole, Deal, CrmTask,
} from '../lib/crm/types';

export const MOCK_DEPARTMENTS: Department[] = [
  { id: 'dep_sales', name: 'Sales', color: 'from-sky-400 to-blue-500', leadId: 'usr_002' },
  { id: 'dep_support', name: 'Support', color: 'from-emerald-400 to-green-500', leadId: 'usr_003' },
  { id: 'dep_dev', name: 'Engineering', color: 'from-violet-400 to-purple-500', leadId: 'usr_006' },
];

export const MOCK_CUSTOM_ROLES: CustomRole[] = [
  { id: 'role_hr', name: 'HR', permissions: ['viewAll', 'manageMembers'] },
  { id: 'role_finance', name: 'Finance', permissions: ['viewAll', 'manageDeals'] },
];

export const MOCK_CRM_CONTACTS: CrmContact[] = [
  {
    userId: 'usr_001', displayName: 'Анна Волкова', role: 'admin',
    departmentId: 'dep_sales', title: 'CEO', status: 'internal',
    phone: '+7 999 111-22-33', email: 'anna@neumorphic.dev', tags: ['founder'], online: true,
  },
  {
    userId: 'usr_002', displayName: 'Дмитрий Козлов', role: 'manager',
    departmentId: 'dep_sales', title: 'Sales Lead', status: 'internal',
    phone: '+7 999 222-33-44', email: 'dmitry@neumorphic.dev', tags: ['sales'], online: true,
  },
  {
    userId: 'usr_003', displayName: 'Елена Соколова', role: 'manager',
    departmentId: 'dep_support', title: 'Support Lead', status: 'internal',
    phone: '+7 999 333-44-55', email: 'elena@neumorphic.dev', tags: ['support'], online: false,
  },
  {
    userId: 'usr_004', displayName: 'Иван Петров', role: 'member',
    departmentId: 'dep_sales', title: 'Sales Rep', status: 'internal',
    phone: '+7 999 444-55-66', email: 'ivan@neumorphic.dev', tags: ['sales'], online: true,
  },
  {
    userId: 'usr_005', displayName: 'Мария Новикова', role: 'member',
    departmentId: 'dep_support', title: 'Support Agent', status: 'internal',
    phone: '+7 999 555-66-77', email: 'maria@neumorphic.dev', tags: ['support'], online: false,
  },
  {
    userId: 'usr_006', displayName: 'Алексей Морозов', role: 'member',
    departmentId: 'dep_dev', title: 'CTO', status: 'internal',
    phone: '+7 999 666-77-88', email: 'alexey@neumorphic.dev', tags: ['eng'], online: true,
  },
  {
    userId: 'cli_001', displayName: 'ООО «Ромашка»', role: 'member',
    departmentId: null, title: 'Client', status: 'client',
    phone: '+7 495 100-20-30', email: 'info@romashka.ru', tags: ['vip', 'retail'],
    assignedManagerId: 'usr_002', online: false,
  },
  {
    userId: 'cli_002', displayName: 'Игорь Сидоров', role: 'member',
    departmentId: null, title: 'Procurement', status: 'lead',
    phone: '+7 495 200-30-40', email: 'igor@sidorov.com', tags: ['lead'],
    assignedManagerId: 'usr_002', online: true,
  },
  {
    userId: 'cli_003', displayName: 'ООО «ТехноПартнёр»', role: 'member',
    departmentId: null, title: 'Partner', status: 'partner',
    phone: '+7 495 300-40-50', email: 'deal@techno.ru', tags: ['partner'],
    assignedManagerId: 'usr_003', online: false,
  },
];

export const MOCK_DEALS: Deal[] = [
  {
    id: 'deal_001', title: 'Поставка оборудования', contactId: 'cli_001', stage: 'negotiation',
    amount: 1200000, currency: 'RUB', ownerId: 'usr_002', expectedClose: Date.now() + 14 * 86400000,
    createdAt: Date.now() - 20 * 86400000,
  },
  {
    id: 'deal_002', title: 'Консалтинг', contactId: 'cli_002', stage: 'qualified',
    amount: 250000, currency: 'RUB', ownerId: 'usr_002', expectedClose: Date.now() + 30 * 86400000,
    createdAt: Date.now() - 5 * 86400000,
  },
  {
    id: 'deal_003', title: 'Интеграция API', contactId: 'cli_003', stage: 'proposal',
    amount: 480000, currency: 'RUB', ownerId: 'usr_003', expectedClose: Date.now() + 10 * 86400000,
    createdAt: Date.now() - 12 * 86400000,
  },
  {
    id: 'deal_004', title: 'Поддержка (год)', contactId: 'cli_001', stage: 'won',
    amount: 360000, currency: 'RUB', ownerId: 'usr_003', createdAt: Date.now() - 60 * 86400000,
  },
  {
    id: 'deal_005', title: 'Пилот (отклонён)', contactId: 'cli_002', stage: 'lost',
    amount: 90000, currency: 'RUB', ownerId: 'usr_002', createdAt: Date.now() - 40 * 86400000,
  },
];

export const MOCK_TASKS: CrmTask[] = [
  {
    id: 'task_001', title: 'Подготовить КП для Ромашки', done: false, priority: 'high',
    dueAt: Date.now() + 2 * 86400000, assigneeId: 'usr_002', contactId: 'cli_001',
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'task_002', title: 'Позвонить Игорю Сидорову', done: false, priority: 'medium',
    dueAt: Date.now() + 1 * 86400000, assigneeId: 'usr_002', contactId: 'cli_002',
    createdAt: Date.now() - 2 * 86400000,
  },
  {
    id: 'task_003', title: 'Выслать договор ТехноПартнёр', done: true, priority: 'low',
    assigneeId: 'usr_003', contactId: 'cli_003', createdAt: Date.now() - 3 * 86400000,
  },
];

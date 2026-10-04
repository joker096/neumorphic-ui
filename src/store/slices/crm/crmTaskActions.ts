import type { CrmTask } from '../../../lib/crm/types';
import { uid } from './crmShared';
import type { CrmSlice } from '../crmSlice';

/** Task mutations. */
export const createCrmTaskActions = (set: any): Pick<
  CrmSlice,
  'addTask' | 'updateTask' | 'toggleTask' | 'removeTask'
> => ({
  addTask: (task) => set((s: any) => ({
    crmTasks: [...s.crmTasks, { ...task, id: uid('task'), createdAt: Date.now(), done: task.done ?? false }],
  })),
  updateTask: (id, patch) => set((s: any) => ({
    crmTasks: s.crmTasks.map((t: CrmTask) => (t.id === id ? { ...t, ...patch } : t)),
  })),
  toggleTask: (id) => set((s: any) => ({
    crmTasks: s.crmTasks.map((t: CrmTask) => (t.id === id ? { ...t, done: !t.done } : t)),
  })),
  removeTask: (id) => set((s: any) => ({
    crmTasks: s.crmTasks.filter((t: CrmTask) => t.id !== id),
  })),
});
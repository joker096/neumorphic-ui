import React, { useEffect, useRef, useState } from 'react';
import { Plus, CheckCircle2, Circle, Trash2, Flag, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../../store';
import { useI18n } from '../../lib/i18n';
import { CRM_FALLBACKS } from '../../constants/crmConstants';
import type { CrmTask, TaskPriority } from '../../lib/crm/types';
import { CrmModal } from './CrmModal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useTheme } from '../../contexts/ThemeContext';
import { useCrmPermissions } from '../../lib/crm/permissions';

const priorityColor: Record<TaskPriority, string> = {
  low: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
  medium: 'bg-amber-400/15 text-amber-500',
  high: 'bg-rose-400/15 text-rose-500',
};

const inputCls =
  'w-full min-h-11 px-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none border border-[var(--border-color)] focus:border-[var(--accent)] text-xs';
const labelCls = 'text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-2 block';

type Props = { task?: CrmTask; onClose: () => void };

const TaskModal: React.FC<Props> = ({ task, onClose }) => {
  const { t } = useI18n();
  const contacts = useAppStore((s) => s.crmContacts);
  const addTask = useAppStore((s) => s.addTask);
  const updateTask = useAppStore((s) => s.updateTask);
  const userId = useAppStore((s) => s.userProfile.id);
  const { can } = useCrmPermissions();

  const editable = can('manageTasks');
  const [form, setForm] = useState({
    title: task?.title ?? '',
    priority: (task?.priority ?? 'medium') as TaskPriority,
    dueAt: task?.dueAt ? new Date(task.dueAt).toISOString().slice(0, 10) : '',
    assigneeId: task?.assigneeId ?? userId,
    contactId: task?.contactId ?? '',
  });
  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.title.trim()) { toast.error(t('crm.titleRequired', 'Title is required')); return; }
    const payload = {
      title: form.title.trim(),
      priority: form.priority,
      dueAt: form.dueAt ? new Date(form.dueAt).getTime() : null,
      assigneeId: form.assigneeId || null,
      contactId: form.contactId || null,
    };
    if (task) { updateTask(task.id, payload); toast.success(t('crm.taskSaved', 'Task saved')); }
    else { addTask(payload); toast.success(t('crm.taskCreated', 'Task created')); }
    onClose();
  };

  return (
    <CrmModal
      onClose={onClose}
      title={task ? task.title : t('crm.newTask', 'New task')}
      footer={
        editable ? (
          <button onClick={handleSave} aria-label={t('crm.save', CRM_FALLBACKS.save)} title={t('crm.save', CRM_FALLBACKS.save)} className="w-full min-h-11 rounded-xl font-bold text-sm cursor-pointer transition-all bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:brightness-110 flex items-center justify-center gap-2">
            <Check size={16} aria-hidden="true" />
            <span className="sr-only">{t('crm.save', CRM_FALLBACKS.save)}</span>
          </button>
        ) : <div className="text-center text-xs text-[var(--text-secondary)] py-2">{t('crm.readOnly', 'Read only')}</div>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <label className={labelCls}>{t('crm.taskTitle', CRM_FALLBACKS.taskTitle)}</label>
          <input value={form.title} disabled={!editable} onChange={(e) => set('title', e.target.value)} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>{t('crm.priority', CRM_FALLBACKS.priority)}</label>
            <select value={form.priority} disabled={!editable} onChange={(e) => set('priority', e.target.value as TaskPriority)} className={inputCls}>
              <option value="low">{t('crm.priorityLow', 'Low')}</option>
              <option value="medium">{t('crm.priorityMedium', 'Medium')}</option>
              <option value="high">{t('crm.priorityHigh', 'High')}</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>{t('crm.due', CRM_FALLBACKS.due)}</label>
            <input type="date" value={form.dueAt} disabled={!editable} onChange={(e) => set('dueAt', e.target.value)} className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>{t('crm.assignee', CRM_FALLBACKS.assignee)}</label>
            <select value={form.assigneeId} disabled={!editable} onChange={(e) => set('assigneeId', e.target.value)} className={inputCls}>
              {contacts.map((c) => <option key={c.userId} value={c.userId}>{c.displayName}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>{t('crm.contact', 'Contact')}</label>
            <select value={form.contactId} disabled={!editable} onChange={(e) => set('contactId', e.target.value)} className={inputCls}>
              <option value="">—</option>
              {contacts.map((c) => <option key={c.userId} value={c.userId}>{c.displayName}</option>)}
            </select>
          </div>
        </div>
      </div>
    </CrmModal>
  );
};

type CrmTasksProps = {
  focusTaskId?: string | null;
  onFocusHandled?: () => void;
};

export const CrmTasks: React.FC<CrmTasksProps> = ({ focusTaskId, onFocusHandled }) => {
  const { t } = useI18n();
  const { isDark } = useTheme();
  const tasks = useAppStore((s) => s.crmTasks);
  const contacts = useAppStore((s) => s.crmContacts);
  const filters = useAppStore((s) => s.crmFilters);
  const toggleTask = useAppStore((s) => s.toggleTask);
  const removeTask = useAppStore((s) => s.removeTask);
  const { can } = useCrmPermissions();

  const [showAdd, setShowAdd] = useState(false);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [confirmTaskId, setConfirmTaskId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const lastFocus = useRef<string | null>(null);

  useEffect(() => {
    if (!focusTaskId || lastFocus.current === focusTaskId) return undefined;
    lastFocus.current = focusTaskId;
    setHighlightId(focusTaskId);
    const timer = window.setTimeout(() => {
      document.getElementById(`crm-task-${focusTaskId}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      setHighlightId(null);
      onFocusHandled?.();
    }, 60);
    return () => window.clearTimeout(timer);
  }, [focusTaskId, onFocusHandled]);

  const name = (id?: string | null) => (id ? contacts.find((c) => c.userId === id)?.displayName : null);

  const editTask = tasks.find((x) => x.id === editTaskId) ?? null;

  const q = filters.search.trim().toLowerCase();
  const visibleTasks = q
    ? tasks.filter((task) =>
        task.title.toLowerCase().includes(q)
        || (name(task.assigneeId) ?? '').toLowerCase().includes(q)
        || (name(task.contactId) ?? '').toLowerCase().includes(q))
    : tasks;
  const sorted = [...visibleTasks].sort((a, b) => Number(a.done) - Number(b.done) || (a.dueAt ?? 0) - (b.dueAt ?? 0));

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-3 py-3">
      <div className="flex items-center justify-between px-2 mb-3">
        <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
          {visibleTasks.filter((x) => !x.done).length} {t('crm.open', 'open')}
        </span>
        {can('manageTasks') && (
          <button onClick={() => setShowAdd(true)} aria-label={t('crm.addTask', CRM_FALLBACKS.addTask)} title={t('crm.addTask', CRM_FALLBACKS.addTask)} className="w-9 h-9 min-w-11 min-h-11 rounded-xl font-bold text-sm cursor-pointer transition-all bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:brightness-110 flex items-center justify-center">
            <Plus size={16} aria-hidden="true" />
            <span className="sr-only">{t('crm.addTask', CRM_FALLBACKS.addTask)}</span>
          </button>
        )}
      </div>

      {visibleTasks.length === 0 && <div className="py-10 text-center text-sm text-[var(--text-secondary)]">{t('crm.noTasks', CRM_FALLBACKS.noTasks)}</div>}

      <div className="flex flex-col gap-2">
        {sorted.map((task) => (
          <div
            key={task.id}
            id={`crm-task-${task.id}`}
            onClick={() => setEditTaskId(task.id)}
            className={`flex items-center gap-3 p-3 rounded-2xl border border-[var(--border-color)] cursor-pointer ${task.done ? 'opacity-60' : ''} ${highlightId === task.id ? 'ring-2 ring-[var(--accent)]' : ''}`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                can('manageTasks') && toggleTask(task.id);
              }}
              className="shrink-0 cursor-pointer"
              disabled={!can('manageTasks')}
            >
              {task.done ? <CheckCircle2 size={20} className="text-[var(--color-success)]" /> : <Circle size={20} className="text-[var(--text-secondary)]" />}
            </button>
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium break-words ${task.done ? 'line-through text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>{task.title}</div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-[var(--text-secondary)]">
                <span className={`px-1.5 py-0.5 rounded-full ${priorityColor[task.priority]}`}><Flag size={12} className="inline mr-0.5" />{task.priority}</span>
                {name(task.assigneeId) && <span>👤 {name(task.assigneeId)}</span>}
                {task.dueAt && <span>⏰ {new Date(task.dueAt).toLocaleDateString()}</span>}
                {name(task.contactId) && <span>🔗 {name(task.contactId)}</span>}
              </div>
            </div>
            {can('manageTasks') && (
               <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmTaskId(task.id);
                }}
                className="shrink-0 text-[var(--text-secondary)] hover:text-[var(--color-danger)] cursor-pointer"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      {showAdd && <TaskModal onClose={() => setShowAdd(false)} />}

      {editTask && <TaskModal task={editTask} onClose={() => setEditTaskId(null)} />}

      <ConfirmDialog
        isOpen={confirmTaskId !== null}
        title={t('crm.confirmDeleteTask', 'Delete task?')}
        message={tasks.find((x) => x.id === confirmTaskId)?.title ?? ''}
        confirmLabel={t('common.confirm', 'Confirm')}
        cancelLabel={t('common.cancel', 'Cancel')}
        confirmIcon={<Trash2 />}
        cancelIcon={<X />}
        variant="danger"
        theme={isDark ? 'dark' : 'light'}
        zIndex="z-[130]"
        onConfirm={() => {
          if (confirmTaskId) removeTask(confirmTaskId);
          setConfirmTaskId(null);
        }}
        onCancel={() => setConfirmTaskId(null)}
      />
    </div>
  );
};

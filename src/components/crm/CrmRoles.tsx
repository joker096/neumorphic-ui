import React, { useState } from 'react';
import { Plus, Trash2, ShieldCheck, Building2, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../../store';
import { useI18n } from '../../lib/i18n';
import { CRM_FALLBACKS, PERMISSION_META } from '../../constants/crmConstants';
import type { CrmPermission } from '../../lib/crm/types';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useTheme } from '../../contexts/ThemeContext';
import { useCrmPermissions } from '../../lib/crm/permissions';
import { TINY_BOLD_CLASS, SECONDARY_CAPTION_CLASS } from '../ui/textClasses';
import { CRM_FIELD_INPUT_CLASS } from './crmClasses';
import { LABEL_ROW_CLASS } from '../ui/rowClasses';
/** Role name taking the remaining width of a role row. */
const ROLE_NAME_CLASS = 'flex-1 font-bold text-sm text-[var(--text-primary)]';

/** Primary button that adds a department or a custom role. */
const ADD_BTN_CLASS = 'min-h-11 px-3 rounded-xl bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] font-bold cursor-pointer';

/** Dashed placeholder shown when a role or department list is empty. */
const EMPTY_HINT_CLASS = 'text-xs text-[var(--text-secondary)] p-3 rounded-2xl border border-dashed border-[var(--border-color)] text-center';

/** Delete button of a role or department row. */
const DANGER_TEXT_BTN_CLASS = 'min-w-11 min-h-11 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--color-danger)] cursor-pointer shrink-0 rounded-xl';

/** Accent caps label above a block of CRM roles. */
const SECTION_LABEL_CLASS =
  'flex items-center gap-2 px-1 mb-1.5 text-xs font-bold uppercase tracking-widest text-[var(--accent)]';

const DEP_COLORS = ['from-sky-400 to-blue-500', 'from-emerald-400 to-green-500', 'from-violet-400 to-purple-500', 'from-amber-400 to-orange-500', 'from-rose-400 to-pink-500'];

export const CrmRoles: React.FC = () => {
  const { t } = useI18n();
  const { isDark } = useTheme();
  const departments = useAppStore((s) => s.crmDepartments);
  const contacts = useAppStore((s) => s.crmContacts);
  const customRoles = useAppStore((s) => s.crmCustomRoles);
  const addDepartment = useAppStore((s) => s.addDepartment);
  const updateDepartment = useAppStore((s) => s.updateDepartment);
  const removeDepartment = useAppStore((s) => s.removeDepartment);
  const addCustomRole = useAppStore((s) => s.addCustomRole);
  const updateCustomRole = useAppStore((s) => s.updateCustomRole);
  const toggleCustomRolePermission = useAppStore((s) => s.toggleCustomRolePermission);
  const removeCustomRole = useAppStore((s) => s.removeCustomRole);
  const userId = useAppStore((s) => s.userProfile.id);
  const userName = useAppStore((s) => s.userProfile.name);
  const resetCrmDemo = useAppStore((s) => s.resetCrmDemo);
  const { can } = useCrmPermissions();

  const [depName, setDepName] = useState('');
  const [roleName, setRoleName] = useState('');
  const [confirm, setConfirm] = useState<{ type: 'department' | 'role' | 'reset'; id?: string } | null>(null);

  const internalContacts = contacts.filter((c) => c.status === 'internal');

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-2 py-2 gap-4">
      {/* Departments */}
      <section>
        <div className={SECTION_LABEL_CLASS}>
          <Building2 size={14} /> {t('crm.departments', CRM_FALLBACKS.departments)}
        </div>
        {can('manageDepartments') && (
          <div className="flex gap-2 mb-2 px-1">
            <input aria-label={t('crm.departmentName', 'Department name')} value={depName} onChange={(e) => setDepName(e.target.value)} placeholder={t('crm.departmentName', 'Department name')} className={CRM_FIELD_INPUT_CLASS} />
            <button onClick={() => { if (depName.trim()) { addDepartment(depName.trim(), DEP_COLORS[departments.length % DEP_COLORS.length]); setDepName(''); toast.success(t('crm.departmentCreated', 'Department created')); } }} className={ADD_BTN_CLASS}>
              <Plus size={16} />
            </button>
          </div>
        )}
        <div className="flex flex-col gap-1.5 px-1">
          {departments.length === 0 && (
            <div className={EMPTY_HINT_CLASS}>
              {t('crm.noDepartments', 'No departments yet. Add the first one.')}
            </div>
          )}
          {departments.map((d) => (
            <div key={d.id} className="flex items-center gap-2 p-2.5 rounded-xl border border-[var(--border-color)]">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${d.color} shrink-0`} />
              {can('manageDepartments') ? (
                <input aria-label={t('crm.departmentName', 'Department name')} value={d.name} onChange={(e) => updateDepartment(d.id, { name: e.target.value })} className={`${CRM_FIELD_INPUT_CLASS} flex-1`} />
              ) : (
                <span className={ROLE_NAME_CLASS}>{d.name}</span>
              )}
              {can('manageDepartments') && (
                <select
                  aria-label={t('crm.departmentLead', CRM_FALLBACKS.departmentLead)}
                  value={d.leadId ?? ''}
                  onChange={(e) => updateDepartment(d.id, { leadId: e.target.value || null })}
                  className={CRM_FIELD_INPUT_CLASS}
                >
                  <option value="">{t('crm.departmentLead', CRM_FALLBACKS.departmentLead)}: —</option>
                  {internalContacts.map((c) => <option key={c.userId} value={c.userId}>{c.displayName}</option>)}
                </select>
              )}
              {can('manageDepartments') && (
                <button onClick={() => setConfirm({ type: 'department', id: d.id })} aria-label={t('crm.deleteDepartment', 'Delete department')} title={t('crm.deleteDepartment', 'Delete department')} className={DANGER_TEXT_BTN_CLASS}>
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Custom roles */}
      <section>
        <div className={SECTION_LABEL_CLASS}>
          <ShieldCheck size={14} /> {t('crm.customRoles', CRM_FALLBACKS.customRoles)}
        </div>
        {can('manageRoles') && (
          <div className="flex gap-2 mb-2 px-1">
            <input aria-label={t('crm.roleName', CRM_FALLBACKS.roleName)} value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder={t('crm.roleName', CRM_FALLBACKS.roleName)} className={CRM_FIELD_INPUT_CLASS} />
            <button onClick={() => { if (roleName.trim()) { addCustomRole(roleName.trim()); setRoleName(''); toast.success(t('crm.roleCreated', 'Role created')); } }} className={ADD_BTN_CLASS}>
              <Plus size={16} />
            </button>
          </div>
        )}
        <div className="flex flex-col gap-2 px-1">
          {customRoles.length === 0 && (
            <div className={EMPTY_HINT_CLASS}>
              {t('crm.noRoles', 'No custom roles yet. Create one to fine-tune access.')}
            </div>
          )}
          {customRoles.map((r) => (
            <div key={r.id} className="p-2.5 rounded-xl border border-[var(--border-color)]">
              <div className={LABEL_ROW_CLASS}>
                {can('manageRoles') ? (
                  <input aria-label={t('crm.roleName', CRM_FALLBACKS.roleName)} value={r.name} onChange={(e) => updateCustomRole(r.id, { name: e.target.value })} className={`${CRM_FIELD_INPUT_CLASS} flex-1`} />
                ) : (
                  <span className={ROLE_NAME_CLASS}>{r.name}</span>
                )}
                {can('manageRoles') && (
                  <button onClick={() => setConfirm({ type: 'role', id: r.id })} aria-label={t('crm.deleteRole', 'Delete role')} title={t('crm.deleteRole', 'Delete role')} className={DANGER_TEXT_BTN_CLASS}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PERMISSION_META.map((p) => {
                  const active = r.permissions.includes(p.id as CrmPermission);
                  return (
                    <button
                      key={p.id}
                      disabled={!can('manageRoles')}
                      onClick={() => toggleCustomRolePermission(r.id, p.id as CrmPermission)}
                      className={`text-left p-2 rounded-xl border transition-all ${
                        active ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-[var(--border-color)]'
                      } ${can('manageRoles') ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      <div className={TINY_BOLD_CLASS}>
                        {t(p.labelKey, (CRM_FALLBACKS as any)[p.labelKey.replace('crm.', '')])}
                        {active && <span className="ml-1 text-[var(--accent)]">✓</span>}
                      </div>
                      <div className={SECONDARY_CAPTION_CLASS}>{t(p.descriptionKey, (CRM_FALLBACKS as any)[p.descriptionKey.replace('crm.', '')])}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {can('manageRoles') && (
        <section>
          <div className={SECTION_LABEL_CLASS}>
            <RefreshCw size={14} /> {t('crm.data', 'Data')}
          </div>
          <div className="px-1">
            <button
              type="button"
              onClick={() => setConfirm({ type: 'reset' })}
              aria-label={t('crm.resetDemo', CRM_FALLBACKS.resetDemo)}
              title={t('crm.resetDemo', CRM_FALLBACKS.resetDemo)}
              className="min-h-11 px-4 rounded-xl cursor-pointer transition-all bg-[var(--color-danger-soft)] text-[var(--color-danger)] inline-flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} aria-hidden="true" />
              <span>{t('crm.resetDemo', CRM_FALLBACKS.resetDemo)}</span>
            </button>
          </div>
        </section>
      )}

      <ConfirmDialog
        isOpen={confirm !== null}
        title={
          confirm?.type === 'department'
            ? t('crm.confirmDeleteDepartment', 'Delete department?')
            : confirm?.type === 'role'
              ? t('crm.confirmDeleteRole', 'Delete role?')
              : t('crm.confirmResetDemo', 'Reset to demo data?')
        }
        message={confirm?.type === 'reset' ? t('crm.resetDemoWarning', 'This will replace your current CRM data.') : ''}
        confirmLabel={t('common.confirm', 'Confirm')}
        cancelLabel={t('common.cancel', 'Cancel')}
        confirmIcon={<Trash2 />}
        cancelIcon={<X />}
        variant="danger"
        theme={isDark ? 'dark' : 'light'}
        zIndex="z-[var(--z-modal-nested)]"
        onConfirm={() => {
          if (confirm?.type === 'department' && confirm.id) removeDepartment(confirm.id);
          else if (confirm?.type === 'role' && confirm.id) removeCustomRole(confirm.id);
          else if (confirm?.type === 'reset') {
            resetCrmDemo(userId, userName);
            toast.success(t('crm.demoReset', 'Demo data restored'));
          }
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
};

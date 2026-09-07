import React, { useState } from 'react';
import { X, Trash2, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { CompanyDepartment, CompanyMember } from '../../types/constants';
import { useI18n } from '../../lib/i18n';
import { DEPARTMENT_COLORS, departmentColorAt } from '../../constants/companyConstants';
import { FormField } from '../ui/FormField';
import { ConfirmDialog } from '../ui/ConfirmDialog';

type DepartmentModalProps = {
  department: CompanyDepartment | null;
  members: CompanyMember[];
  isDark?: boolean;
  canManage: boolean;
  onClose: () => void;
  onSave: (input: { name: string; description?: string; color?: string; memberIds?: string[] }) => void;
  onRemove?: (id: string) => void;
};

const initials = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

export const DepartmentModal: React.FC<DepartmentModalProps> = ({
  department,
  members,
  isDark = false,
  canManage,
  onClose,
  onSave,
  onRemove,
}) => {
  const { t } = useI18n();
  const [name, setName] = useState(department?.name || '');
  const [description, setDescription] = useState(department?.description || '');
  const [color, setColor] = useState(department?.color || departmentColorAt(0));
  const [memberIds, setMemberIds] = useState<string[]>(department?.memberIds || []);
  const [saving, setSaving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const colorSwatch = (isDark ? 'border-white/30' : 'border-black/10');

  const toggleMember = (id: string) =>
    setMemberIds((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error(t('company.departmentName', 'Department name'));
      return;
    }
    setSaving(true);
    try {
      onSave({ name: trimmed, description: description.trim() || undefined, color, memberIds });
      toast.success(t('company.memberSaved', 'Saved'));
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = () => {
    if (department && onRemove) {
      setConfirmRemove(true);
    }
  };

  const handleConfirmRemove = () => {
    if (department && onRemove) {
      onRemove(department.id);
      toast.success(t('company.memberRemoved', 'Removed'));
      setConfirmRemove(false);
      onClose();
    }
  };

  const panelBg = isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]" : "bg-white border border-[var(--border-color)]";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`w-full max-w-[340px] md:max-w-[400px] p-6 shadow-2xl relative rounded-2xl ${panelBg}`}>
<button
  type="button"
  aria-label={t('common.close')}
  onClick={onClose}
  className="absolute top-4 right-4 z-10 w-10 h-10 min-w-11 min-h-11 rounded-full flex items-center justify-center cursor-pointer transition-all bg-black/5 hover:bg-black/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
>
  <X size={18} />
</button>
        <h3 className="text-xl font-bold mb-5 text-[var(--text-primary)]">
          {department ? t('company.editDepartment', 'Edit department') : t('company.addDepartment', 'Add department')}
        </h3>

        <div className="flex flex-col gap-4">
          <FormField
            label={t('company.departmentName', 'Department name')}
            placeholder={t('company.departmentNamePlaceholder', 'e.g. Engineering')}
            value={name}
            onChange={setName}
            theme={isDark ? 'dark' : 'light'}
            required
          />

          <div className="p-4 rounded-md neu-card-inset">
            <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-2 block">
              {t('company.departmentDescription', 'Description')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('company.departmentDescriptionPlaceholder', 'What does this department do?')}
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none border border-[var(--border-color)] focus:border-[var(--accent)] text-sm resize-none"
            />
          </div>

          <div className="p-4 rounded-md neu-card-inset">
            <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-2 block">
              {t('company.departmentColor', 'Color')}
            </label>
            <div className="flex flex-wrap gap-2">
              {DEPARTMENT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-9 h-9 min-w-11 min-h-11 rounded-full bg-gradient-to-br ${c} transition-all ${
                    color === c ? 'ring-2 ring-offset-2 ring-[var(--accent)] ring-offset-[var(--bg-tertiary)]' : ''
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="p-4 rounded-md neu-card-inset">
            <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-2 block">
              {t('company.departmentMembers', 'Members')}
            </label>
            {members.length === 0 ? (
              <div className="text-xs text-[var(--text-secondary)]">
                {t('company.emptyMembers', 'No members yet')}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                {members.map((m) => {
                  const selected = memberIds.includes(m.userId);
                  return (
                    <button
                      key={m.userId}
                      onClick={() => toggleMember(m.userId)}
                      className={`w-full min-h-11 px-3 rounded-xl flex items-center gap-2.5 cursor-pointer transition-all text-left ${
                        selected ? 'bg-[var(--accent)]/15' : 'bg-[var(--bg-secondary)]'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br from-indigo-400 to-purple-500">
                        {initials(m.displayName)}
                      </div>
                      <span className="flex-1 text-sm text-[var(--text-primary)] truncate">{m.displayName}</span>
                      {selected && <Check size={16} className="text-[var(--accent)]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {department && canManage && onRemove && (
            <button
              onClick={handleRemove}
              aria-label={t('company.removeMember', 'Remove')}
              title={t('company.removeMember', 'Remove')}
              className="w-9 h-9 min-w-11 min-h-11 rounded-xl flex items-center justify-center gap-2 font-bold text-sm cursor-pointer transition-all bg-[var(--color-danger-soft)] text-[var(--color-danger)] hover:brightness-110"
            >
              <Trash2 size={16} />
              <span className="sr-only">{t('company.removeMember', 'Remove')}</span>
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            aria-label={t('company.save', 'Save')}
            title={t('company.save', 'Save')}
            className="w-full min-h-11 rounded-xl flex items-center justify-center gap-2 font-bold text-sm cursor-pointer transition-all bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:brightness-110 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
            <span>{t('company.save', 'Save')}</span>
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmRemove}
        title={t('company.confirmRemoveDepartment', 'Remove this department?')}
        message={department?.name ?? ''}
        confirmLabel={t('common.confirm', 'Confirm')}
        cancelLabel={t('common.cancel', 'Cancel')}
        confirmIcon={<Trash2 />}
        cancelIcon={<X />}
        variant="danger"
        theme={isDark ? 'dark' : 'light'}
        zIndex="z-[130]"
        onConfirm={handleConfirmRemove}
        onCancel={() => setConfirmRemove(false)}
      />
    </div>
  );
};

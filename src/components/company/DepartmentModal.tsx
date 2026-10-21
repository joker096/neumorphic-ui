import { FORM_FIELD_GROUP_CLASS, FORM_FIELD_LABEL_CLASS, FORM_ICON_DANGER_BTN_CLASS, FORM_PRIMARY_BTN_CLASS } from '../ui/formClasses';
import React, { useState } from 'react';
import { modalOverlay } from '../ui/modalShared';
import { X, Trash2, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { CompanyDepartment, CompanyMember } from '../../types/constants';
import { useI18n } from '../../lib/i18n';
import { DEPARTMENT_COLORS, departmentColorAt } from '../../constants/companyConstants';
import { FormField } from '../ui/FormField';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { CompanyModalCloseButton } from './CompanyModalCloseButton';
import { COMPANY_TEXTAREA_CLASS, COMPANY_MODAL_TITLE_CLASS } from './companyClasses';
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
  useEscapeKey(onClose);

  const colorSwatch = "border-black/10 dark:border-white/30";

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

  const panelBg = "bg-[var(--bg-tertiary)] border border-[var(--border-color)]";

  return (
    <div className={modalOverlay}>
      <div className={`w-full max-w-[340px] md:max-w-[400px] p-6 shadow-2xl relative rounded-2xl ${panelBg}`}>
<CompanyModalCloseButton onClick={onClose} />
        <h3 className={COMPANY_MODAL_TITLE_CLASS}>
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

          <div className={FORM_FIELD_GROUP_CLASS}>
            <label className={FORM_FIELD_LABEL_CLASS}>
              {t('company.departmentDescription', 'Description')}
            </label>
            <textarea
              aria-label={t('company.departmentDescriptionPlaceholder', 'What does this department do?')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('company.departmentDescriptionPlaceholder', 'What does this department do?')}
              rows={2}
              className={COMPANY_TEXTAREA_CLASS}
            />
          </div>

          <div className={FORM_FIELD_GROUP_CLASS}>
            <label className={FORM_FIELD_LABEL_CLASS}>
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

          <div className={FORM_FIELD_GROUP_CLASS}>
            <label className={FORM_FIELD_LABEL_CLASS}>
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
              className={`${FORM_ICON_DANGER_BTN_CLASS}`}
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
            className={FORM_PRIMARY_BTN_CLASS}
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
        zIndex="z-[var(--z-modal-nested)]"
        onConfirm={handleConfirmRemove}
        onCancel={() => setConfirmRemove(false)}
      />
    </div>
  );
};

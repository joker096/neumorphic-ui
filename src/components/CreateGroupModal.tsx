import { useState } from 'react';
import { Check, Users } from 'lucide-react';
import { useAppStore } from '../store';
import { useI18n } from '../lib/i18n';
import { AppModal } from './ui/AppModal';
import {
  modalLabelClass,
  modalFieldClass,
  modalPrimaryBtnClass,
  modalOptionClass,
} from './ui/modalShared';

export const CreateGroupModal = ({ theme = 'dark', onClose }: { theme?: 'dark' | 'light'; onClose: () => void }) => {
  const isDark = theme === "dark";
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { contacts, createGroup } = useAppStore();

  const toggleMember = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleCreate = () => {
    if (!name.trim() || selectedIds.length === 0) return;
    createGroup({ name: name.trim(), memberIds: selectedIds });
    onClose();
  };

  return (
    <AppModal isOpen={true} onClose={onClose} isDark={isDark} title={t('createGroup.title')} maxWidth="max-w-sm">
      <div className="flex flex-col gap-2">
        <label className={modalLabelClass}>{t('createGroup.nameLabel')}</label>
        <input aria-label={t('createGroup.namePlaceholder')} autoFocus value={name} onChange={e => setName(e.target.value)} type="text" className={modalFieldClass} placeholder={t('createGroup.namePlaceholder')} />
      </div>

      <div className="flex flex-col gap-2">
        <label className={modalLabelClass}>{t('createGroup.membersLabel')}</label>
        <div className="max-h-48 overflow-y-auto flex flex-col gap-1">
          {contacts.map((c: any) => {
            const selected = selectedIds.includes(c.id);
            return (
              <div key={c.id} role="button" tabIndex={0} onClick={() => toggleMember(c.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMember(c.id); } }} className={modalOptionClass(selected)}>
                <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${c.color} flex items-center justify-center text-white text-xs font-bold`}>
                  {c.name.charAt(0)}
                </div>
                <span className="text-sm font-bold">{c.name}</span>
                {selected && <Check size={16} />}
              </div>
            );
          })}
        </div>
      </div>

      <button onClick={handleCreate} disabled={!name.trim() || selectedIds.length === 0} aria-label={t('createGroup.create')} title={t('createGroup.create')} className={modalPrimaryBtnClass}>
        <Users size={18} /> <span>{t('createGroup.create')}</span>
      </button>
    </AppModal>
  );
};

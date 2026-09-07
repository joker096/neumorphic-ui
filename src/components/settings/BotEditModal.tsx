import React, { useState } from 'react';
import type { BotConfig } from '../../store';
import { Bot } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { AppModal } from '../ui/AppModal';
import {
  modalLabelClass,
  modalFieldClass,
  modalPrimaryBtnClass,
  modalSecondaryBtnClass,
} from '../ui/modalShared';

export interface BotEditModalProps {
  bot: BotConfig;
  theme?: 'dark' | 'light';
  onSave: (bot: BotConfig) => void;
  onClose: () => void;
}

export const BotEditModal = ({ bot, theme = 'dark', onSave, onClose }: BotEditModalProps) => {
  const isDark = theme === 'dark';
  const { t } = useI18n();
  const [name, setName] = useState(bot.name);
  const [description, setDescription] = useState(bot.description ?? '');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ ...bot, name: name.trim(), description: description.trim() });
  };

  return (
    <AppModal isOpen={true} onClose={onClose} isDark={isDark} icon={<Bot size={18} />} title={t('bot.editTitle')} maxWidth="max-w-sm">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className={modalLabelClass}>{t('bot.nameLabel')}</label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
            type="text"
            className={modalFieldClass}
            placeholder={t('bot.nameLabel')}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={modalLabelClass}>{t('bot.descriptionLabel')}</label>
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
            type="text"
            className={modalFieldClass}
            placeholder={t('bot.descriptionPlaceholder')}
          />
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className={modalSecondaryBtnClass}>{t('common.cancel')}</button>
          <button onClick={handleSave} disabled={!name.trim()} aria-label={t('common.save')} className={modalPrimaryBtnClass}>{t('common.save')}</button>
        </div>
      </div>
    </AppModal>
  );
};

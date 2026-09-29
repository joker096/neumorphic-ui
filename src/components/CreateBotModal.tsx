import React, { useState } from 'react';
import { useAppStore } from '../store';
import type { BotConfig } from '../store';
import { Bot, Check, Key } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { createBotConfig } from '../lib/bot';
import { saveBot } from '../lib';
import { AppModal } from './ui/AppModal';
import {
  modalLabelClass,
  modalFieldClass,
  modalPrimaryBtnClass,
  modalInfoClass,
} from './ui/modalShared';

export interface CreateBotModalProps {
  theme?: 'dark' | 'light';
  onClose: () => void;
  onCreated?: (bot: BotConfig) => void;
}

export const CreateBotModal = ({ theme = 'dark', onClose, onCreated }: CreateBotModalProps) => {
  const isDark = theme === "dark";
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { setBots } = useAppStore();

  const handleCreate = async () => {
    if (!name.trim() || loading) return;
    setLoading(true);
    const newBot = await createBotConfig(name);
    setBots((prev) => [...prev, newBot]);
    // persist to idb bots_list so localBot.getBotProfile/getMiniApp can resolve it
    await saveBot(newBot);
    setLoading(false);
    onCreated?.(newBot);
    onClose();
  };

  return (
    <AppModal isOpen={true} onClose={onClose} isDark={isDark} icon={<Bot size={18} />} title={t('createBot.title')} maxWidth="max-w-sm">
      <div className="flex flex-col gap-2">
          <label className={modalLabelClass}>{t('createBot.nameLabel')}</label>
         <input
           aria-label={t('createBot.namePlaceholder')}
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') void handleCreate(); }}
          type="text"
          className={modalFieldClass}
          placeholder={t('createBot.namePlaceholder')}
         />
      </div>

      <div className={modalInfoClass}>
         <Key size={18} className="shrink-0 mt-0.5" />
         <p className="leading-relaxed">{t('createBot.info')}</p>
      </div>

      <button onClick={() => void handleCreate()} disabled={!name.trim() || loading} aria-label={t('createBot.generate')} title={t('createBot.generate')} className={modalPrimaryBtnClass}>
         {loading ? <div className="w-5 h-5 border-2 border-[var(--border-color)] border-t-white rounded-full animate-spin"></div> : <><Check size={20} /> <span>{t('createBot.generate')}</span></>}
      </button>
    </AppModal>
  )
};

import React, { useState } from 'react';
import { useAppStore, BotConfig, DEFAULT_BOT_PERMISSIONS } from '../store';
import { Bot, Check, Key } from 'lucide-react';
import { deviceSecurity } from '../lib/deviceSecurity';
import { buf2hex } from '../lib/crypto/cryptoCore';
import { useI18n } from '../lib/i18n';
import { AppModal } from './ui/AppModal';
import {
  modalLabelClass,
  modalFieldClass,
  modalPrimaryBtnClass,
  modalInfoClass,
} from './ui/modalShared';
import { BOT_DEFAULT_OWNER_ID, BOT_ID_PREFIX } from '../constants/botConstants';

export const CreateBotModal = ({ theme = 'dark', onClose }: { theme?: 'dark' | 'light', onClose: () => void }) => {
  const isDark = theme === "dark";
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { bots, setBots } = useAppStore();

  const handleCreate = async () => {
      if (!name.trim()) return;
      setLoading(true);
      
      const keyPair = await window.crypto.subtle.generateKey(
         { name: "ECDH", namedCurve: "P-256" },
         true,
         ["deriveKey", "deriveBits"]
      );
      
      const pubRaw = await window.crypto.subtle.exportKey("raw", keyPair.publicKey);
      const privJwk = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);
      const pubBase64 = btoa(String.fromCharCode(...new Uint8Array(pubRaw)));
      
      const fingerprint = await deviceSecurity.getDeviceFingerprint();
      const fpHash = buf2hex(await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(fingerprint))).substring(0, 8);
      const privBase64 = btoa(privJwk.d || "mock_priv_d");
      
       const botId = `${BOT_ID_PREFIX}${Date.now()}`;
       const token = `bot:${botId}_${fpHash}_${privBase64}`;

       const newBot: BotConfig = {
          id: botId,
          name,
          token,
          publicKey: pubBase64,
          ownerId: BOT_DEFAULT_OWNER_ID,
          commands: [],
          permissions: { ...DEFAULT_BOT_PERMISSIONS },
          isRunning: false
       };
      
       setBots([...bots, newBot]);
       setLoading(false);
       onClose();
  };

  return (
    <AppModal isOpen={true} onClose={onClose} isDark={isDark} title={t('createBot.title')} maxWidth="max-w-sm">
      <div className="flex flex-col gap-2">
          <label className={modalLabelClass}>{t('createBot.nameLabel')}</label>
         <input autoFocus value={name} onChange={e => setName(e.target.value)} type="text" className={modalFieldClass} placeholder={t('createBot.namePlaceholder')} />
      </div>

      <div className={modalInfoClass}>
         <Key size={18} className="shrink-0 mt-0.5" />
         <p className="leading-relaxed">{t('createBot.info')}</p>
      </div>

      <button onClick={handleCreate} disabled={!name.trim() || loading} className={modalPrimaryBtnClass}>
         {loading ? <div className="w-5 h-5 border-2 border-[var(--border-color)] border-t-white rounded-full animate-spin"></div> : <><Check size={20} /> {t('createBot.generate')}</>}
      </button>
    </AppModal>
  )
};





import React, { useState } from 'react';
import { useAppStore, BotConfig, DEFAULT_BOT_PERMISSIONS } from '../store';
import { X, Bot, Check, Key } from 'lucide-react';
import { deviceSecurity } from '../lib/deviceSecurity';
import { buf2hex } from '../lib/crypto/cryptoCore';
import { useI18n } from '../lib/i18n';
import { AppModal } from './ui/AppModal';

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
      
      const botId = `bot_${Date.now()}`;
      const token = `bot:${botId}_${fpHash}_${privBase64}`;
      
      const newBot: BotConfig = {
         id: botId,
         name,
         token,
         publicKey: pubBase64,
         ownerId: "me",
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
          <label className={`text-xs pl-2 font-semibold tracking-wide uppercase ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('createBot.nameLabel')}</label>
         <input autoFocus value={name} onChange={e => setName(e.target.value)} type="text" className={`w-full h-12 rounded-2xl px-4 outline-none transition-all ${isDark ? "bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-orange-500/50" : "bg-slate-50 border border-[var(--border-color)] focus:border-orange-500/50"}`} placeholder={t('createBot.namePlaceholder')} />
      </div>

      <div className={`text-xs p-4 rounded-xl flex gap-3 ${isDark ? "bg-orange-500/10 text-orange-200" : "bg-orange-50 text-orange-800"}`}>
         <Key size={18} className="shrink-0 mt-0.5" />
         <p className="leading-relaxed">{t('createBot.info')}</p>
      </div>

      <button onClick={handleCreate} disabled={!name.trim() || loading} className={`w-full h-14 rounded-2xl mt-4 font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 ${(!name.trim() || loading) ? "opacity-50 cursor-not-allowed" : ""} ${isDark ? "bg-gradient-to-tr from-orange-500 to-orange-400 text-[var(--text-primary)] shadow-[0_0_20px_rgba(249,115,22,0.3)]" : "bg-gradient-to-tr from-orange-400 to-orange-300 text-orange-950 shadow-lg"}`}>
         {loading ? <div className="w-5 h-5 border-2 border-[var(--border-color)] border-t-white rounded-full animate-spin"></div> : <><Check size={20} /> {t('createBot.generate')}</>}
      </button>
    </AppModal>
  )
};





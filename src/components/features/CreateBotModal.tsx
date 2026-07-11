import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore, BotConfig, DEFAULT_BOT_PERMISSIONS } from '../../store';
import { X, Bot, Check, Key } from 'lucide-react';
import { deviceSecurity } from '../../lib/deviceSecurity';
import { buf2hex } from '../../lib/crypto/cryptoCore';
import { useI18n } from '../../lib/i18n';

export const CreateBotModal = ({ onClose }: { onClose: () => void }) => {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { bots, setBots } = useAppStore();

  const handleCreate = async () => {
     if (!name.trim()) return;
     setLoading(true);
     
     // 1. Generate P-256 keypair for Bot
     const keyPair = await window.crypto.subtle.generateKey(
        { name: "ECDH", namedCurve: "P-256" },
        true,
        ["deriveKey", "deriveBits"]
     );
     
     // 2. Export keys
     const pubRaw = await window.crypto.subtle.exportKey("raw", keyPair.publicKey);
     const privJwk = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);
     const pubBase64 = btoa(String.fromCharCode(...new Uint8Array(pubRaw)));
     
      // 3. Encrypt private key with device-bound key
      const fingerprint = await deviceSecurity.getDeviceFingerprint();
      const fpHash = buf2hex(await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(fingerprint))).substring(0, 8);
      const privRaw = new TextEncoder().encode(privJwk.d || "mock_priv_d");
      const wrapKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(fpHash), { name: "AES-GCM", length: 128 }, false, ["encrypt"]);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encPriv = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, wrapKey, privRaw);
      const encBuf = new Uint8Array(iv.length + encPriv.byteLength);
      encBuf.set(iv); encBuf.set(new Uint8Array(encPriv), iv.length);
      const encPrivB64 = btoa(String.fromCharCode(...encBuf));
      
      const botId = `bot_${Date.now()}`;
      const token = `bot:${botId}_${fpHash}_${encPrivB64}`;
     
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
    <motion.div 
       initial={{ opacity: 0 }}
       animate={{ opacity: 1 }}
       exit={{ opacity: 0 }}
       className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
       <motion.div 
         initial={{ y: 50, scale: 0.95 }}
         animate={{ y: 0, scale: 1 }}
         exit={{ y: 50, scale: 0.95 }}
         className="w-full max-w-sm p-6 shadow-2xl relative flex flex-col gap-5 modal-surface"
       >
          <div className="flex items-center justify-between mb-2">
             <div className="flex items-center gap-3">
               <Bot className="text-orange-500" size={28} />
                <h3 className="text-xl font-bold tracking-tight text-[--text-primary]">{t('createBot.title')}</h3>
             </div>
             <div onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors neu-button">
               <X size={16} />
             </div>
          </div>
          
          <div className="flex flex-col gap-2">
              <label className="text-xs pl-2 font-semibold tracking-wide uppercase text-[--text-secondary]">{t('createBot.nameLabel')}</label>
             <input autoFocus value={name} onChange={e => setName(e.target.value)} type="text" className="w-full h-12 rounded-md px-4 outline-none transition-all neu-inset-field" placeholder={t('createBot.namePlaceholder')} />
          </div>

          <div className="text-xs p-4 rounded-md flex gap-3 text-orange-600 bg-orange-50">
             <Key size={18} className="shrink-0 mt-0.5" />
             <p className="leading-relaxed">{t('createBot.info')}</p>
          </div>

          <button onClick={handleCreate} disabled={!name.trim() || loading} className={`w-full h-14 rounded-md mt-4 font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 ${(!name.trim() || loading) ? "opacity-50 cursor-not-allowed" : ""} bg-gradient-to-tr from-orange-500 to-orange-400 text-white shadow-lg`}>
             {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Check size={20} /> {t('createBot.generate')}</>}
          </button>
       </motion.div>
    </motion.div>
  )
};

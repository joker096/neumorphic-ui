import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore, BotConfig } from '../store';
import { X, Bot, Check, Key } from 'lucide-react';
import { deviceSecurity } from '../lib/deviceSecurity';
import { buf2hex } from '../lib/crypto/cryptoCore';
import { useI18n } from '../lib/i18n';

export const CreateBotModal = ({ theme, onClose }: { theme: 'dark' | 'light', onClose: () => void }) => {
  const isDark = theme === "dark";
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
     
     // 3. To securely embed in token, we simulate "encryptedPrivateKey" 
     // For demo, we just dump JWK D parameter. In real app, we encrypt this with user's public key or symmetric wrap
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
        permissions: {
           readMessages: true,
           sendMessages: true,
           editMessages: false,
           deleteMessages: false,
           inlineKeyboard: true,
           readUserData: false,
           accessGroups: false,
           accessFiles: false
        },
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
         className={`w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative flex flex-col gap-5 ${isDark ? "bg-[#1a1d24] border border-white/10 text-white" : "bg-white border border-black/5 text-slate-800"}`}
       >
          <div className="flex items-center justify-between mb-2">
             <div className="flex items-center gap-3">
               <Bot className={isDark ? "text-orange-400" : "text-orange-600"} size={28} />
                <h3 className="text-xl font-bold tracking-tight">{t('createBot.title')}</h3>
             </div>
             <div onClick={onClose} className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors ${isDark ? "bg-white/10 hover:bg-white/20" : "bg-black/5 hover:bg-black/10"}`}>
               <X size={16} />
             </div>
          </div>
          
          <div className="flex flex-col gap-2">
              <label className={`text-xs pl-2 font-semibold tracking-wide uppercase ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('createBot.nameLabel')}</label>
             <input autoFocus value={name} onChange={e => setName(e.target.value)} type="text" className={`w-full h-12 rounded-2xl px-4 outline-none transition-all ${isDark ? "bg-[#13151b] border border-white/5 focus:border-orange-500/50" : "bg-slate-50 border border-black/5 focus:border-orange-500/50"}`} placeholder={t('createBot.namePlaceholder')} />
          </div>

          <div className={`text-xs p-4 rounded-xl flex gap-3 ${isDark ? "bg-orange-500/10 text-orange-200" : "bg-orange-50 text-orange-800"}`}>
             <Key size={18} className="shrink-0 mt-0.5" />
             <p className="leading-relaxed">{t('createBot.info')}</p>
          </div>

          <button onClick={handleCreate} disabled={!name.trim() || loading} className={`w-full h-14 rounded-2xl mt-4 font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 ${(!name.trim() || loading) ? "opacity-50 cursor-not-allowed" : ""} ${isDark ? "bg-gradient-to-tr from-orange-500 to-orange-400 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]" : "bg-gradient-to-tr from-orange-400 to-orange-300 text-orange-950 shadow-lg"}`}>
             {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Check size={20} /> {t('createBot.generate')}</>}
          </button>
       </motion.div>
    </motion.div>
  )
};

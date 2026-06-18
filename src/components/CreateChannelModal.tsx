import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore, P2PChannel } from '../store';
import { X, Globe, Lock, Check, Shield } from 'lucide-react';
import { generateChannelKeypair } from '../lib/crypto/channelSigning';
import { generatePostKey } from '../lib/crypto/postKeyManager';
import { useI18n } from '../lib/i18n';

export const CreateChannelModal = ({ theme, onClose }: { theme: 'dark' | 'light', onClose: () => void }) => {
  const isDark = theme === "dark";
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const { channels, setChannels } = useAppStore();

  const handleCreate = () => {
      if (!name.trim()) return;
      
      // Generate channel signing keypair
      const keypair = generateChannelKeypair();
      
      // Generate per-post key for E2EE comments
      const channelPostKey = generatePostKey(`chan_${Date.now()}`);

      const newChannel: P2PChannel = {
         id: `chan_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
         name,
         ownerPublicKey: keypair.publicKey,
         channelId: `channel_${name.toLowerCase().replace(/\s+/g, '_')}`,
         subscriberCount: 1,
         postCount: 0,
         isPrivate: !isPublic,
         isPublic,
         createdAt: Date.now(),
         description: desc,
         rules: [],
         settings: {
            canPost: false,
            canComment: true,
            commentsRequireApproval: false,
            canReact: true,
            allowDownloads: true,
            pinMessages: true,
            showSubscribers: true,
            allowForwarding: false,
            allowReactions: true,
            allowComments: true,
            allowEditing: false,
            allowDeletion: true,
         },
         signedAt: Date.now(),
         signedBy: keypair.privateKey,
         postKey: channelPostKey.publicKey,
      };
      
      // To support UI mapping for now, add legacy properties
      const channelWithUIProps = {
         ...newChannel,
         isChannel: true,
         history: [],
         message: desc || "Канал создан",
         time: "Just now",
         unread: 0,
         color: "from-blue-500 to-indigo-500", // Random mock color could be generated
         signingKey: keypair.publicKey,
         privateKey: keypair.privateKey,
      };

      setChannels([channelWithUIProps as any, ...channels]);
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
             <h3 className="text-xl font-bold tracking-tight">{t('createChannel.title')}</h3>
             <div onClick={onClose} className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors ${isDark ? "bg-white/10 hover:bg-white/20" : "bg-black/5 hover:bg-black/10"}`}>
               <X size={16} />
             </div>
          </div>
          
          <div className="flex flex-col gap-2">
             <label className={`text-xs pl-2 font-semibold tracking-wide uppercase ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('createChannel.nameLabel')}</label>
             <input autoFocus value={name} onChange={e => setName(e.target.value)} type="text" className={`w-full h-12 rounded-2xl px-4 outline-none transition-all ${isDark ? "bg-[#13151b] border border-white/5 focus:border-orange-500/50" : "bg-slate-50 border border-black/5 focus:border-orange-500/50"}`} placeholder={t('createChannel.namePlaceholder')} />
          </div>

          <div className="flex flex-col gap-2">
             <label className={`text-xs pl-2 font-semibold tracking-wide uppercase ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('createChannel.descriptionLabel')}</label>
             <input value={desc} onChange={e => setDesc(e.target.value)} type="text" className={`w-full h-12 rounded-2xl px-4 outline-none transition-all ${isDark ? "bg-[#13151b] border border-white/5 focus:border-orange-500/50" : "bg-slate-50 border border-black/5 focus:border-orange-500/50"}`} placeholder={t('createChannel.descriptionPlaceholder')} />
          </div>

          <div className="flex gap-3 mt-2">
             <div onClick={() => setIsPublic(true)} className={`flex-1 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all border ${isPublic ? (isDark ? "border-orange-500 bg-orange-500/10 text-orange-400" : "border-orange-500 bg-orange-50 text-orange-600") : (isDark ? "border-white/5 bg-[#13151b] text-gray-400" : "border-black/5 bg-slate-50 text-slate-500")}`}>
               <Globe size={24} />
                <span className="text-xs font-bold">{t('createChannel.public')}</span>
             </div>
             <div onClick={() => setIsPublic(false)} className={`flex-1 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all border ${!isPublic ? (isDark ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-blue-500 bg-blue-50 text-blue-600") : (isDark ? "border-white/5 bg-[#13151b] text-gray-400" : "border-black/5 bg-slate-50 text-slate-500")}`}>
               <Lock size={24} />
                <span className="text-xs font-bold">{t('createChannel.private')}</span>
             </div>
          </div>

          <button onClick={handleCreate} disabled={!name.trim()} className={`w-full h-14 rounded-2xl mt-4 font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 ${!name.trim() ? "opacity-50 cursor-not-allowed" : ""} ${isDark ? "bg-gradient-to-tr from-orange-500 to-orange-400 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]" : "bg-gradient-to-tr from-orange-400 to-orange-300 text-orange-950 shadow-lg"}`}>
              <Check size={20} /> {t('createChannel.create')}
          </button>
       </motion.div>
    </motion.div>
  )
};

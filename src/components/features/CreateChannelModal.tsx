import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore, P2PChannel } from '../../store';
import { X, Globe, Lock, Check, Shield } from 'lucide-react';
import { generateChannelKeypair } from '../../lib/crypto/channelSigning';
import { generatePostKey } from '../../lib/crypto/postKeyManager';
import { useI18n } from '../../lib/i18n';

export const CreateChannelModal = ({ onClose }: { onClose: () => void }) => {
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
         message: desc || t('createChannel.channelCreated'),
         time: "Just now",
         unread: 0,
         color: "from-blue-500 to-indigo-500",
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
         className="w-full max-w-sm p-6 shadow-2xl relative flex flex-col gap-5 modal-surface"
       >
          <div className="flex items-center justify-between mb-2">
             <h3 className="text-xl font-bold tracking-tight text-[--text-primary]">{t('createChannel.title')}</h3>
             <div onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors neu-button">
               <X size={16} />
             </div>
          </div>
          
          <div className="flex flex-col gap-2">
             <label className="text-xs pl-2 font-semibold tracking-wide uppercase text-[--text-secondary]">{t('createChannel.nameLabel')}</label>
             <input autoFocus value={name} onChange={e => setName(e.target.value)} type="text" className={`w-full h-12 rounded-md px-4 outline-none transition-all neu-inset-field`} placeholder={t('createChannel.namePlaceholder')} />
          </div>

          <div className="flex flex-col gap-2">
             <label className="text-xs pl-2 font-semibold tracking-wide uppercase text-[--text-secondary]">{t('createChannel.descriptionLabel')}</label>
             <input value={desc} onChange={e => setDesc(e.target.value)} type="text" className={`w-full h-12 rounded-md px-4 outline-none transition-all neu-inset-field`} placeholder={t('createChannel.descriptionPlaceholder')} />
          </div>

          <div className="flex gap-3 mt-2">
<div onClick={() => setIsPublic(true)} className="flex-1 rounded-md p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all border border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]">
                <Globe size={24} />
                 <span className="text-xs font-bold text-[--text-primary]">{t('createChannel.public')}</span>
              </div>
              <div onClick={() => setIsPublic(false)} className="flex-1 rounded-md p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all border border-blue-500 bg-blue-50 text-blue-600">
                <Lock size={24} />
                 <span className="text-xs font-bold text-[--text-primary]">{t('createChannel.private')}</span>
              </div>
          </div>

          <button onClick={handleCreate} disabled={!name.trim()} className={`w-full h-14 rounded-md mt-4 font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 ${!name.trim() ? "opacity-50 cursor-not-allowed" : ""} bg-gradient-to-tr from-orange-500 to-orange-400 text-orange-950 shadow-lg`}>
              <Check size={20} /> {t('createChannel.create')}
          </button>
       </motion.div>
    </motion.div>
  )
};

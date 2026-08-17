import { useState } from 'react';
import { useAppStore, P2PChannel } from '../store';
import { Globe, Lock, Check } from 'lucide-react';
import { generateChannelKeypair } from '../lib/crypto/channelSigning';
import { generatePostKey } from '../lib/crypto/postKeyManager';
import { useI18n } from '../lib/i18n';
import { AppModal } from './ui/AppModal';
import {
  modalLabelClass,
  modalFieldClass,
  modalPrimaryBtnClass,
  modalOptionClass,
} from './ui/modalShared';
import { DEFAULT_CHANNEL_GRADIENT } from '../constants/channelConstants';

export const CreateChannelModal = ({ theme = 'dark', onClose }: { theme?: 'dark' | 'light', onClose: () => void }) => {
  const isDark = theme === "dark";
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const { channels, setChannels } = useAppStore();

  const handleCreate = () => {
      if (!name.trim()) return;
      
      const keypair = generateChannelKeypair();
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
      
      const channelWithUIProps = {
         ...newChannel,
         isChannel: true,
         history: [],
          message: desc || t('createChannel.channelCreated'),
          time: t('chat.justNow'),
          unread: 0,
          color: DEFAULT_CHANNEL_GRADIENT,
         signingKey: keypair.publicKey,
         privateKey: keypair.privateKey,
      };

      setChannels([channelWithUIProps as any, ...channels]);
      onClose();
   };

   return (
    <AppModal isOpen={true} onClose={onClose} isDark={isDark} title={t('createChannel.title')} maxWidth="max-w-sm">
      <div className="flex flex-col gap-2">
         <label className={modalLabelClass}>{t('createChannel.nameLabel')}</label>
         <input autoFocus value={name} onChange={e => setName(e.target.value)} type="text" className={modalFieldClass} placeholder={t('createChannel.namePlaceholder')} />
      </div>

      <div className="flex flex-col gap-2">
         <label className={modalLabelClass}>{t('createChannel.descriptionLabel')}</label>
         <input value={desc} onChange={e => setDesc(e.target.value)} type="text" className={modalFieldClass} placeholder={t('createChannel.descriptionPlaceholder')} />
      </div>

      <div className="flex gap-3 mt-2">
         <div onClick={() => setIsPublic(true)} className={modalOptionClass(isPublic)}>
           <Globe size={24} />
            <span className="text-xs font-bold">{t('createChannel.public')}</span>
         </div>
         <div onClick={() => setIsPublic(false)} className={modalOptionClass(!isPublic)}>
            <Lock size={24} />
            <span className="text-xs font-bold">{t('createChannel.private')}</span>
         </div>
      </div>

      <button onClick={handleCreate} disabled={!name.trim()} className={modalPrimaryBtnClass}>
          <Check size={20} /> {t('createChannel.create')}
      </button>
    </AppModal>
  );
};


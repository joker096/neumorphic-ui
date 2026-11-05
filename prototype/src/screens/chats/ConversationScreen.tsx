import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MoreVertical, Phone, Video } from 'lucide-react';
import { AppBar } from '../../components/ui/AppBar';
import { Avatar } from '../../components/ui/Avatar';
import { DropdownMenu } from '../../components/ui/DropdownMenu';
import { MessageInput } from '../../components/ui/MessageInput';
import { ScreenTransition } from '../../app/ScreenTransition';
import { useChatsStore } from '../../store/chats';
import { chatMenuItems } from './chatMenuItems';
import { ConversationThread } from './ConversationThread';
import { AttachSheet } from './AttachSheet';
import { PhotoLightbox } from './PhotoLightbox';
import styles from './ConversationScreen.module.css';

export function ConversationScreen() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const chat = useChatsStore((s) => s.chats.find((c) => c.id === id));
  const sendMessage = useChatsStore((s) => s.sendMessage);
  const [draft, setDraft] = useState('');
  const [menu, setMenu] = useState(false);
  const [attach, setAttach] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);

  const send = () => {
    if (!draft.trim()) return;
    sendMessage(id, { text: draft });
    setDraft('');
  };

  return (
    <ScreenTransition>
      <div className={`screen ${styles.screen}`}>
        <AppBar
          tone="blue"
          onBack={() => navigate('/home')}
          left={<Avatar src={chat?.avatar} name={chat?.title} size={32} />}
          title={chat?.title ?? 'Chat'}
          right={
            <>
              <button type="button" className={styles.icon} onClick={() => navigate(`/call/${id}/video`)} aria-label="Video call">
                <Video size={22} strokeWidth={1.75} />
              </button>
              <button type="button" className={styles.icon} onClick={() => navigate(`/call/${id}/voice`)} aria-label="Voice call">
                <Phone size={22} strokeWidth={1.75} />
              </button>
              <button type="button" className={styles.icon} onClick={() => setMenu(true)} aria-label="Chat menu">
                <MoreVertical size={22} strokeWidth={1.75} />
              </button>
            </>
          }
        />
        <DropdownMenu open={menu} onClose={() => setMenu(false)} items={chatMenuItems} onSelect={() => undefined} />
        <ConversationThread chatId={id} onImageClick={setPhoto} />
        <MessageInput
          value={draft}
          onChange={setDraft}
          onSend={send}
          onAttach={() => setAttach((v) => !v)}
          onCamera={() => navigate(`/chat/${id}/camera`)}
        />
        <AttachSheet open={attach} onClose={() => setAttach(false)} onPick={setPhoto} />
        <PhotoLightbox src={photo} onClose={() => setPhoto(null)} />
      </div>
    </ScreenTransition>
  );
}


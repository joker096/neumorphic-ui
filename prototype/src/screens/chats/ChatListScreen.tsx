import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquarePlus, MoreVertical, Search } from 'lucide-react';
import { AppBar } from '../../components/ui/AppBar';
import { ListItem } from '../../components/ui/ListItem';
import { DropdownMenu } from '../../components/ui/DropdownMenu';
import { ScreenTransition } from '../../app/ScreenTransition';
import { APP_NAME } from '../../data/mock';
import { useChatsStore } from '../../store/chats';
import { EmptyChats } from './EmptyChats';
import styles from './ChatListScreen.module.css';

const TABS = [
  { id: 'chats', label: 'Chats' },
  { id: 'status', label: 'Status' },
  { id: 'calls', label: 'Calls' },
];

const MENU = [
  { id: 'new', label: 'New group' },
  { id: 'archived', label: 'Archived' },
];

export function ChatListScreen() {
  const navigate = useNavigate();
  const chats = useChatsStore((s) => s.chats);
  const hasStarted = useChatsStore((s) => s.hasStarted);
  const startChatting = useChatsStore((s) => s.startChatting);
  const [tab, setTab] = useState('chats');
  const [menuOpen, setMenuOpen] = useState(false);
  const unread = chats.reduce((total, chat) => total + (chat.unread ?? 0), 0);

  const openChat = (id: string) => {
    startChatting();
    navigate(`/chat/${id}`);
  };

  return (
    <ScreenTransition>
      <div className={`screen ${styles.screen}`}>
        <AppBar
          tone="blue"
          title={APP_NAME}
          tabs={unread > 0 ? TABS.map((t) => (t.id === 'chats' ? { ...t, badge: unread } : t)) : TABS}
          activeTab={tab}
          onTabChange={setTab}
          right={
            <>
              <button type="button" className={styles.iconBtn} aria-label="Search">
                <Search size={22} strokeWidth={1.75} />
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="Chat menu"
                onClick={() => setMenuOpen(true)}
              >
                <MoreVertical size={22} strokeWidth={1.75} />
              </button>
            </>
          }
        />
        <DropdownMenu open={menuOpen} onClose={() => setMenuOpen(false)} items={MENU} onSelect={() => navigate('/select-contact')} />

        <div className="screen-body">
          {!hasStarted ? (
            <EmptyChats name={APP_NAME} onStart={() => navigate('/select-contact')} />
          ) : (
            <ul className={styles.list}>
              {chats.map((chat) => (
                <li key={chat.id}>
                  <ListItem
                    name={chat.title}
                    preview={chat.lastMessage}
                    avatar={chat.avatar}
                    time={chat.time}
                    unread={chat.unread}
                    isGroup={chat.isGroup}
                    onClick={() => openChat(chat.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <button type="button" className={styles.fab} onClick={() => navigate('/select-contact')} aria-label="New chat">
          <MessageSquarePlus size={24} strokeWidth={2} />
        </button>
      </div>
    </ScreenTransition>
  );
}

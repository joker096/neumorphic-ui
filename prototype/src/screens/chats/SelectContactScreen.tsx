import { useNavigate } from 'react-router-dom';
import { QrCode, Search, UserPlus, Users } from 'lucide-react';
import { AppBar } from '../../components/ui/AppBar';
import { Avatar } from '../../components/ui/Avatar';
import { ScreenTransition } from '../../app/ScreenTransition';
import { contacts } from '../../data/mock';
import { useChatsStore } from '../../store/chats';
import styles from './SelectContactScreen.module.css';

export function SelectContactScreen() {
  const navigate = useNavigate();
  const startChatting = useChatsStore((s) => s.startChatting);

  const open = (id: string) => {
    startChatting();
    navigate(`/chat/${id}`);
  };

  return (
    <ScreenTransition>
      <div className={`screen ${styles.screen}`}>
        <AppBar
          tone="blue"
          title="Select Contact"
          onBack={() => navigate(-1)}
          right={
            <button type="button" className={styles.iconBtn} aria-label="Search contacts">
              <Search size={22} strokeWidth={1.75} />
            </button>
          }
        />

        <div className={`screen-body ${styles.body}`}>
          <button type="button" className={styles.quick} onClick={() => open(contacts[0]?.id ?? 'jenny')}>
            <span className={styles.quickIcon}>
              <Users size={20} strokeWidth={1.75} />
            </span>
            <span className={styles.quickLabel}>New Group</span>
          </button>

          <button type="button" className={styles.quick} onClick={() => open(contacts[1]?.id ?? 'aileen')}>
            <span className={styles.quickIcon}>
              <UserPlus size={20} strokeWidth={1.75} />
            </span>
            <span className={styles.quickLabel}>New Contact</span>
            <QrCode size={20} strokeWidth={1.75} className={styles.qr} aria-hidden="true" />
          </button>

          <ul className={styles.list}>
            {contacts.map((contact) => (
              <li key={contact.id}>
                <button type="button" className={styles.contact} onClick={() => open(contact.id)}>
                  <Avatar src={contact.avatar} name={contact.name} size={48} />
                  <span className={styles.meta}>
                    <span className={styles.name}>{contact.name}</span>
                    <span className={styles.phone}>{contact.phone}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </ScreenTransition>
  );
}

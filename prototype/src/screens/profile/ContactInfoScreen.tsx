import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, MoreVertical, Phone, Video } from 'lucide-react';
import { AppBar } from '../../components/ui/AppBar';
import { Avatar } from '../../components/ui/Avatar';
import { Switch } from '../../components/ui/Switch';
import { ScreenTransition } from '../../app/ScreenTransition';
import { contacts } from '../../data/mock';
import styles from './ContactInfoScreen.module.css';

export function ContactInfoScreen() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const contact = contacts.find((item) => item.id === id) ?? contacts[0];
  const [muted, setMuted] = useState(false);

  return (
    <ScreenTransition>
      <div className={`screen ${styles.screen}`}>
        <AppBar
          tone="blue"
          onBack={() => navigate(-1)}
          right={
            <>
              <button type="button" className={styles.icon} onClick={() => navigate(`/call/${id}/video`)} aria-label="Video call">
                <Video size={22} strokeWidth={1.75} />
              </button>
              <button type="button" className={styles.icon} onClick={() => navigate(`/call/${id}/voice`)} aria-label="Voice call">
                <Phone size={22} strokeWidth={1.75} />
              </button>
              <button type="button" className={styles.icon} aria-label="Contact menu">
                <MoreVertical size={22} strokeWidth={1.75} />
              </button>
            </>
          }
        />

        <div className={`screen-body ${styles.body}`}>
          <div className={styles.hero}>
            <Avatar src={contact.avatar} name={contact.name} size={88} />
            <h1 className={styles.name}>{contact.name}</h1>
            <p className={styles.phone}>{contact.phone}</p>
            <p className={styles.status}>{contact.status ?? 'Always available. Just contact me 😊'}</p>
            <p className={styles.caption}>December 12, 2024</p>
          </div>

          <button type="button" className={styles.row} onClick={() => navigate(`/contact/${id}/media`)}>
            <span className={styles.rowIcon}>📁</span>
            <span className={styles.rowLabel}>Media, Links &amp; Documents</span>
            <span className={styles.rowValue}>269</span>
            <ChevronRight size={18} strokeWidth={1.75} className={styles.chevron} />
          </button>

          <div className={styles.row}>
            <span className={styles.rowIcon}>🔔</span>
            <span className={styles.rowLabel}>Mute Notification</span>
            <Switch checked={muted} onChange={setMuted} label="Mute notification" />
          </div>

          {['Custom Notification', 'Media Visibility', 'Starred Messages', 'Groups in Common'].map((label) => (
            <div key={label} className={styles.row}>
              <span className={styles.rowIcon}>•</span>
              <span className={styles.rowLabel}>{label}</span>
              <ChevronRight size={18} strokeWidth={1.75} className={styles.chevron} />
            </div>
          ))}

          <button type="button" className={`${styles.row} ${styles.danger}`} onClick={() => navigate(-1)}>
            <span className={styles.rowLabel}>Report {contact.name}</span>
          </button>
          <button type="button" className={`${styles.row} ${styles.danger}`} onClick={() => navigate(-1)}>
            <span className={styles.rowLabel}>Block {contact.name}</span>
          </button>
        </div>
      </div>
    </ScreenTransition>
  );
}

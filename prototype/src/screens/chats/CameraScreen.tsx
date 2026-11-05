import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SwitchCamera, X, Zap } from 'lucide-react';
import { ScreenTransition } from '../../app/ScreenTransition';
import { useChatsStore } from '../../store/chats';
import styles from './CameraScreen.module.css';

const SHOT = 'https://picsum.photos/seed/hichat-camera/600/900';

export function CameraScreen() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const sendMessage = useChatsStore((s) => s.sendMessage);
  const [flash, setFlash] = useState(false);

  return (
    <ScreenTransition>
      <div className={`screen ${styles.screen}`}>
        <img className={styles.photo} src={SHOT} alt="Camera preview" />

        <button type="button" className={styles.close} onClick={() => navigate(`/chat/${id}`)} aria-label="Close camera">
          <X size={24} strokeWidth={2} />
        </button>

        <div className={styles.controls}>
          <button
            type="button"
            className={flash ? `${styles.side} ${styles.sideActive}` : styles.side}
            onClick={() => setFlash((v) => !v)}
            aria-pressed={flash}
            aria-label="Toggle flash"
          >
            <Zap size={22} strokeWidth={1.75} />
          </button>

          <button
            type="button"
            className={styles.shutter}
            onClick={() => {
              sendMessage(id, { images: [SHOT] });
              navigate(`/chat/${id}`);
            }}
            aria-label="Take photo"
          >
            <span />
          </button>

          <button type="button" className={styles.side} aria-label="Switch camera">
            <SwitchCamera size={22} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </ScreenTransition>
  );
}

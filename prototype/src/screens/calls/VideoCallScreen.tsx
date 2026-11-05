import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { CallControls } from '../../components/ui/CallControls';
import { useChatsStore } from '../../store/chats';
import { currentUser } from '../../data/mock';
import styles from './CallScreens.module.css';

const clock = (total: number) =>
  `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;

export function VideoCallScreen() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const chat = useChatsStore((s) => s.chats.find((c) => c.id === id));
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className={styles.call}>
      <img className={styles.backdrop} src={chat?.avatar} alt="" />

      <div className={styles.top}>
        <button type="button" className={styles.topBtn} onClick={() => navigate(`/chat/${id}`)} aria-label="Leave call screen">
          <ArrowLeft size={22} strokeWidth={1.75} />
        </button>
      </div>

      <div className={styles.pip}>
        <img src={currentUser.avatar} alt="Your camera" />
      </div>

      <div className={styles.videoMeta}>
        <h1 className={styles.name}>{chat?.title ?? 'Call'}</h1>
        <p className={styles.timer}>{clock(seconds)}</p>
      </div>

      <CallControls
        variant="video"
        muted={muted}
        speaker
        cameraOn={cameraOn}
        onToggleMute={() => setMuted((v) => !v)}
        onToggleSpeaker={() => undefined}
        onToggleCamera={() => setCameraOn((v) => !v)}
        onEnd={() => navigate(`/chat/${id}`)}
      />
    </div>
  );
}

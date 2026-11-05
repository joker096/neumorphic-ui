import { Button } from '../../components/ui/Button';
import { Logo } from '../../components/ui/Logo';
import styles from './EmptyChats.module.css';

const DOTS = [
  { left: '24%', top: '20%', size: 8 },
  { left: '70%', top: '16%', size: 12 },
  { left: '16%', top: '40%', size: 6 },
  { left: '80%', top: '36%', size: 8 },
  { left: '36%', top: '46%', size: 6 },
  { left: '62%', top: '44%', size: 10 },
];

export function EmptyChats({ name, onStart }: { name: string; onStart: () => void }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.hero}>
        {DOTS.map((dot, index) => (
          <span
            key={index}
            aria-hidden="true"
            className={styles.dot}
            style={{ left: dot.left, top: dot.top, width: dot.size, height: dot.size }}
          />
        ))}
        <Logo size={72} />
      </div>

      <h2 className={styles.title}>Welcome! 👋</h2>
      <p className={styles.text}>
        {name} connects you with family and friends. Start chatting now!
      </p>

      <div className={styles.cta}>
        <Button variant="primary" shape="pill" fullWidth onClick={onStart}>
          Start New Chat
        </Button>
      </div>
    </div>
  );
}

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../../components/ui/Logo';
import { ScreenTransition } from '../../app/ScreenTransition';
import styles from './SplashScreen.module.css';

const CONFETTI = [
  { left: '14%', top: '18%', size: 10, opacity: 0.85 },
  { left: '78%', top: '14%', size: 6, opacity: 0.7 },
  { left: '24%', top: '32%', size: 6, opacity: 0.6 },
  { left: '68%', top: '30%', size: 12, opacity: 0.9 },
  { left: '12%', top: '68%', size: 8, opacity: 0.75 },
  { left: '84%', top: '62%', size: 10, opacity: 0.8 },
  { left: '30%', top: '78%', size: 14, opacity: 0.7 },
  { left: '60%', top: '82%', size: 6, opacity: 0.65 },
  { left: '48%', top: '10%', size: 8, opacity: 0.6 },
];

export function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(() => navigate('/welcome', { replace: true }), 2000);
    return () => window.clearTimeout(timer);
  }, [navigate]);

  return (
    <ScreenTransition>
      <div className={`screen ${styles.splash}`}>
        {CONFETTI.map((dot, index) => (
          <span
            key={index}
            aria-hidden="true"
            className={styles.dot}
            style={{ left: dot.left, top: dot.top, width: dot.size, height: dot.size, opacity: dot.opacity }}
          />
        ))}
        <Logo size={88} />
        <div className={styles.loader} role="status" aria-label="Loading">
          {Array.from({ length: 8 }).map((_, index) => (
            <span
              key={index}
              className={styles.spoke}
              style={{ transform: `rotate(${index * 45}deg)`, opacity: 0.15 + index * 0.1 }}
            />
          ))}
        </div>
      </div>
    </ScreenTransition>
  );
}

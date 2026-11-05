import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { ScreenTransition } from '../../app/ScreenTransition';
import { APP_NAME, contacts } from '../../data/mock';
import shared from '../screens.module.css';
import styles from './WelcomeScreen.module.css';

const CLOUD = [
  { left: '16%', top: '8%', size: 56, tint: 'var(--danger)', delay: 0 },
  { left: '46%', top: '0%', size: 72, tint: 'var(--success)', delay: 0.05 },
  { left: '72%', top: '12%', size: 48, tint: null, delay: 0.1 },
  { left: '6%', top: '30%', size: 40, tint: null, delay: 0.15 },
  { left: '34%', top: '34%', size: 64, tint: null, delay: 0.2 },
  { left: '64%', top: '38%', size: 44, tint: 'var(--primary)', delay: 0.25 },
  { left: '20%', top: '62%', size: 48, tint: null, delay: 0.3 },
  { left: '50%', top: '66%', size: 40, tint: null, delay: 0.35 },
  { left: '76%', top: '58%', size: 52, tint: null, delay: 0.4 },
];

export function WelcomeScreen() {
  const navigate = useNavigate();

  return (
    <ScreenTransition>
      <div className={`screen ${shared.page}`}>
        <div className={styles.cloud}>
          {CLOUD.map((item, index) => {
            const contact = contacts[index % contacts.length];
            return (
              <div
                key={index}
                className={styles.avatar}
                style={{
                  left: item.left,
                  top: item.top,
                  width: item.size,
                  height: item.size,
                  background: item.tint ?? 'var(--surface)',
                  animationDelay: `${item.delay}s`,
                }}
              >
                <img src={contact.avatar} alt="" />
                {item.tint && <span className={styles.ring} aria-hidden="true" />}
              </div>
            );
          })}
        </div>

        <div className={styles.copy}>
          <h1 className={shared.h2}>Welcome to {APP_NAME}!</h1>
          <p className={shared.leadSmall}>
            Chat freely with the people you care about.
            <br />
            Simple, fast and private by design.
          </p>
        </div>

        <div className={styles.dots} aria-hidden="true">
          <span className={styles.dot} />
          <span className={`${styles.dot} ${styles.dotActive}`} />
          <span className={styles.dot} />
        </div>

        <div className={styles.actions}>
          <Button variant="primary" shape="pill" fullWidth onClick={() => navigate('/lets-you-in')}>
            Get Started
          </Button>
        </div>
      </div>
    </ScreenTransition>
  );
}

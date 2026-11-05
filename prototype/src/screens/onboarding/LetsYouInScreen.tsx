import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Apple, Facebook, Globe } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ScreenTransition } from '../../app/ScreenTransition';
import shared from '../screens.module.css';
import styles from './LetsYouInScreen.module.css';

const SOCIALS = [
  { id: 'facebook', label: 'Continue with Facebook', icon: Facebook },
  { id: 'google', label: 'Continue with Google', icon: Globe },
  { id: 'apple', label: 'Continue with Apple', icon: Apple },
];

export function LetsYouInScreen() {
  const navigate = useNavigate();

  return (
    <ScreenTransition>
      <div className={`screen ${shared.page}`}>
        <div className={styles.top}>
          <button type="button" className={styles.back} onClick={() => navigate('/welcome')} aria-label="Go back">
            <ArrowLeft size={24} strokeWidth={1.75} />
          </button>
        </div>

        <div className={styles.art} aria-hidden="true">
          <svg viewBox="0 0 240 160" width="100%" height="100%">
            <ellipse cx="120" cy="76" rx="96" ry="62" fill="var(--primary-soft)" />
            <circle cx="58" cy="44" r="18" fill="var(--primary)" opacity="0.18" />
            <circle cx="186" cy="52" r="12" fill="var(--primary)" opacity="0.24" />
            <rect x="72" y="58" width="96" height="58" rx="8" fill="#fff" stroke="var(--primary)" strokeWidth="3" />
            <rect x="106" y="116" width="28" height="10" rx="4" fill="var(--primary)" opacity="0.5" />
            <circle cx="120" cy="38" r="14" fill="var(--primary)" />
            <path d="M92 142h56" stroke="var(--primary)" strokeWidth="4" strokeLinecap="round" opacity="0.35" />
          </svg>
        </div>

        <h1 className={shared.h1}>Let&apos;s you in</h1>
        <p className={`${shared.leadSmall} ${styles.subtitle}`}>
          Sign in to continue chatting with friends and family.
        </p>

        <div className={styles.socials}>
          {SOCIALS.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" className={styles.outline} onClick={() => navigate('/login')}>
              <Icon size={20} strokeWidth={1.75} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className={styles.divider} aria-hidden="true">
          <span />
          <em>or</em>
          <span />
        </div>

        <Button variant="primary" shape="pill" fullWidth onClick={() => navigate('/login')}>
          Sign in with Phone Number
        </Button>

        <div className={shared.linkRow}>
          Don&apos;t have an account?
          <button type="button" className={shared.link} onClick={() => navigate('/create-account')}>
            Sign up
          </button>
        </div>
      </div>
    </ScreenTransition>
  );
}

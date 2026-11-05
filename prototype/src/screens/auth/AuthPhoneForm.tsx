import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import { Keypad } from '../../components/ui/Keypad';
import { Logo } from '../../components/ui/Logo';
import { PhoneInput } from '../../components/ui/PhoneInput';
import { ScreenTransition } from '../../app/ScreenTransition';
import { useAuthStore } from '../../store/auth';
import shared from '../screens.module.css';
import styles from './AuthPhoneForm.module.css';

const MIN_DIGITS = 10;

export function AuthPhoneForm({ mode }: { mode: 'login' | 'create' }) {
  const navigate = useNavigate();
  const phone = useAuthStore((state) => state.phone);
  const setPhone = useAuthStore((state) => state.setPhone);
  const remember = useAuthStore((state) => state.remember);
  const setRemember = useAuthStore((state) => state.setRemember);
  const [keypadOpen, setKeypadOpen] = useState(false);

  const digits = phone.replace(/\D/g, '');
  const canSubmit = digits.length >= MIN_DIGITS;
  const isCreate = mode === 'create';

  return (
    <ScreenTransition>
      <div className={`screen ${styles.screen}`}>
        <div className={styles.header}>
          <button type="button" className={styles.back} onClick={() => navigate('/lets-you-in')} aria-label="Go back">
            <ArrowLeft size={24} strokeWidth={1.75} />
          </button>
        </div>

        <div className={`${shared.page} ${styles.content}`}>
          {isCreate && (
            <div className={styles.logo}>
              <Logo size={72} />
            </div>
          )}

          <h1 className={shared.h1}>{isCreate ? 'Create New Account' : 'Login to Your Account'}</h1>

          <PhoneInput
            value={phone}
            onChange={setPhone}
            autoFocus={false}
            onFocusChange={setKeypadOpen}
          />

          <Checkbox checked={remember} onChange={setRemember} label="Remember me" />

          <Button
            variant="primary"
            shape="pill"
            fullWidth
            disabled={!canSubmit}
            onClick={() => navigate('/otp')}
          >
            {isCreate ? 'Sign up' : 'Sign in'}
          </Button>
        </div>

        <div className={styles.footer}>
          {keypadOpen ? (
            <Keypad
              onDigit={(digit) => setPhone(`${phone}${digit}`)}
              onBackspace={() => setPhone(phone.slice(0, -1))}
            />
          ) : (
            <div className={shared.linkRow}>
              {isCreate ? 'Already have an account?' : "Don't have an account?"}
              <button
                type="button"
                className={shared.link}
                onClick={() => navigate(isCreate ? '/login' : '/create-account')}
              >
                {isCreate ? 'Sign in' : 'Sign up'}
              </button>
            </div>
          )}
        </div>
      </div>
    </ScreenTransition>
  );
}

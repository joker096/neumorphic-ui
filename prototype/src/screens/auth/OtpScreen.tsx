import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar } from '../../components/ui/AppBar';
import { Button } from '../../components/ui/Button';
import { Keypad } from '../../components/ui/Keypad';
import { OtpInput } from '../../components/ui/OtpInput';
import { ScreenTransition } from '../../app/ScreenTransition';
import { useAuthStore } from '../../store/auth';
import shared from '../screens.module.css';
import styles from './OtpScreen.module.css';

const RESEND_SECONDS = 60;

export function OtpScreen() {
  const navigate = useNavigate();
  const phone = useAuthStore((state) => state.phone);
  const otp = useAuthStore((state) => state.otp);
  const setOtp = useAuthStore((state) => state.setOtp);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = window.setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [seconds]);

  const tail = phone.slice(-2).padStart(2, '0') || '00';
  const complete = otp.length === 4;

  return (
    <ScreenTransition>
      <div className={`screen ${styles.screen}`}>
        <AppBar
          title="OTP Code Verification"
          showStatusBar={false}
          right={<span className="sr-only">Verification</span>}
        />

        <div className={`${shared.page} ${styles.body}`}>
          <p className={shared.leadSmall}>
            Code has been send to +1 111 ******{tail}
          </p>

          <OtpInput value={otp} onChange={setOtp} length={4} autoFocus />

          <p className={styles.resend}>
            {seconds > 0 ? (
              <>
                Resend code in <strong>{seconds}</strong> s
              </>
            ) : (
              <button type="button" className={shared.link} onClick={() => setSeconds(RESEND_SECONDS)}>
                Resend
              </button>
            )}
          </p>
        </div>

        <div className={styles.footer}>
          <Keypad
            onDigit={(digit) => setOtp(`${otp}${digit}`.slice(0, 4))}
            onBackspace={() => setOtp(otp.slice(0, -1))}
          />
          <div className={styles.cta}>
            <Button
              variant="primary"
              shape="pill"
              fullWidth
              disabled={!complete}
              onClick={() => navigate('/fill-profile')}
            >
              Verify
            </Button>
          </div>
        </div>
      </div>
    </ScreenTransition>
  );
}

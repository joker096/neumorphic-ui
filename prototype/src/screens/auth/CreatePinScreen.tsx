import { useNavigate } from 'react-router-dom';
import { AppBar } from '../../components/ui/AppBar';
import { Button } from '../../components/ui/Button';
import { Keypad } from '../../components/ui/Keypad';
import { OtpInput } from '../../components/ui/OtpInput';
import { ScreenTransition } from '../../app/ScreenTransition';
import { useAuthStore } from '../../store/auth';
import shared from '../screens.module.css';
import styles from './CreatePinScreen.module.css';

export function CreatePinScreen() {
  const navigate = useNavigate();
  const pin = useAuthStore((state) => state.pin);
  const setPin = useAuthStore((state) => state.setPin);

  return (
    <ScreenTransition>
      <div className={`screen ${styles.screen}`}>
        <AppBar title="Create New PIN" showStatusBar={false} />

        <div className={`${shared.page} ${styles.body}`}>
          <p className={shared.leadSmall}>Add a PIN number to make your account more secure.</p>
          <OtpInput value={pin} onChange={setPin} length={4} mask autoFocus label="PIN" />
        </div>

        <div className={styles.footer}>
          <Keypad
            onDigit={(digit) => setPin(`${pin}${digit}`.slice(0, 4))}
            onBackspace={() => setPin(pin.slice(0, -1))}
          />
          <div className={styles.cta}>
            <Button
              variant="primary"
              shape="pill"
              fullWidth
              disabled={pin.length < 4}
              onClick={() => navigate('/fingerprint')}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </ScreenTransition>
  );
}

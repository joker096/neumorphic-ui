import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fingerprint } from 'lucide-react';
import { AppBar } from '../../components/ui/AppBar';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ScreenTransition } from '../../app/ScreenTransition';
import { useAuthStore } from '../../store/auth';
import shared from '../screens.module.css';
import styles from './FingerprintScreen.module.css';

export function FingerprintScreen() {
  const navigate = useNavigate();
  const profile = useAuthStore((state) => state.profile);
  const setFingerprintEnabled = useAuthStore((state) => state.setFingerprintEnabled);
  const [congrats, setCongrats] = useState(false);

  useEffect(() => {
    if (!congrats) return;
    const timer = window.setTimeout(() => navigate('/home', { replace: true }), 3000);
    return () => window.clearTimeout(timer);
  }, [congrats, navigate]);

  return (
    <ScreenTransition>
      <div className={`screen ${styles.screen}`}>
        <AppBar title="Set Your Fingerprint" showStatusBar={false} />

        <div className={`${shared.page} ${styles.body}`}>
          <p className={shared.leadSmall}>
            Add a fingerprint to make your account more secure. You can skip this step for now.
          </p>

          <div className={styles.print} aria-hidden="true">
            <Fingerprint size={160} strokeWidth={1} />
          </div>

          <p className={styles.caption}>Please put your finger on the fingerprint scanner to get started</p>
        </div>

        <div className={styles.actions}>
          <Button variant="secondary" shape="pill" fullWidth onClick={() => navigate('/home', { replace: true })}>
            Skip
          </Button>
          <Button
            variant="primary"
            shape="pill"
            fullWidth
            onClick={() => {
              setFingerprintEnabled(true);
              setCongrats(true);
            }}
          >
            Continue
          </Button>
        </div>
      </div>

      <Modal open={congrats} labelledBy="congrats-title">
        <div className={styles.modalBody}>
          <div className={styles.modalIcon}>
            <span className={styles.sparkles} aria-hidden="true" />
            <Avatar src={profile.avatar} size={56} />
          </div>
          <h2 id="congrats-title" className={styles.modalTitle}>
            Congratulations!
          </h2>
          <p className={styles.modalText}>
            Your account is ready to use. You will be redirected to the home page in a few seconds.
          </p>
          <div className={styles.loader} role="status" aria-label="Redirecting">
            <span />
            <span />
            <span />
          </div>
        </div>
      </Modal>
    </ScreenTransition>
  );
}

import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { AppLockScreen } from "./AppLockScreen";
import { useAppLock } from "../../hooks/useAppLock";
import { useIdentityAuth } from "../../hooks/useIdentityAuth";
import { useAppStore } from "../../store";

const RegistrationScreen = lazy(
  () => import("../auth/RegistrationScreen").then((m) => ({ default: m.RegistrationScreen })),
);
const LoginScreen = lazy(
  () => import("../auth/LoginScreen").then((m) => ({ default: m.LoginScreen })),
);

type AppAuthGateProps = {
  children: React.ReactNode;
};

export const AppAuthGate = ({ children }: AppAuthGateProps) => {
  const { status: identityStatus, recheck } = useIdentityAuth();
  const {
    pinInput, setPinInput, pinError, biometricError, biometricBusy,
    biometricAvailable, lockAttempts, lockBlockedUntil, lockBlockTimer,
    handleUnlock, handleUnlockBiometric, isLocked, unlockBusy,
    totpInput, setTotpInput, totpError, twoFactorRequired,
  } = useAppLock();
  const biometricEnabled = useAppStore(s => s.appLockBiometricEnabled);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const handler = () => setShowLogin(true);
    window.addEventListener('show-login', handler);
    return () => window.removeEventListener('show-login', handler);
  }, []);

  if (identityStatus === "loading") {
    return (
      <div className="w-full h-[100dvh] flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (identityStatus === "new-user") {
    return (
      <Suspense fallback={null}>
        <RegistrationScreen onComplete={() => void recheck()} />
      </Suspense>
    );
  }

  if (showLogin) {
    return (
      <Suspense fallback={null}>
        <LoginScreen
          onComplete={() => setShowLogin(false)}
          onBack={() => setShowLogin(false)}
        />
      </Suspense>
    );
  }

  if (isLocked) {
    return (
      <AppLockScreen
        pinInput={pinInput}
        setPinInput={setPinInput}
        pinError={pinError}
        totpInput={totpInput}
        setTotpInput={setTotpInput}
        totpError={totpError}
        twoFactorRequired={twoFactorRequired}
        biometricError={biometricError}
        biometricBusy={biometricBusy}
        biometricEnabled={biometricEnabled}
        biometricAvailable={biometricAvailable}
        lockAttempts={lockAttempts}
        lockBlockTimer={lockBlockTimer}
        lockBlockedUntil={lockBlockedUntil}
        unlockBusy={unlockBusy}
        handleUnlock={handleUnlock}
        handleUnlockBiometric={handleUnlockBiometric}
      />
    );
  }

  return <>{children}</>;
};

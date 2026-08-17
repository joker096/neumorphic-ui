import { useCallback, useEffect, useState } from "react";
import { RegistrationScreen, LoginScreen } from "../auth";
import { AppLockScreen } from "./AppLockScreen";
import { useAppLock } from "../../hooks/useAppLock";
import { useIdentityAuth } from "../../hooks/useIdentityAuth";

type AppAuthGateProps = {
  children: React.ReactNode;
  onRegistrationComplete: () => void;
};

export const AppAuthGate = ({ children, onRegistrationComplete }: AppAuthGateProps) => {
  const { status: identityStatus } = useIdentityAuth();
  const {
    pinInput, setPinInput, pinError, lockAttempts,
    lockBlockedUntil, lockBlockTimer, handleUnlock, isLocked,
  } = useAppLock();
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
    return <RegistrationScreen onComplete={onRegistrationComplete} />;
  }

  if (showLogin) {
    return <LoginScreen onComplete={onRegistrationComplete} />;
  }

  if (isLocked) {
    return (
      <AppLockScreen
        pinInput={pinInput}
        setPinInput={setPinInput}
        pinError={pinError}
        lockAttempts={lockAttempts}
        lockBlockTimer={lockBlockTimer}
        lockBlockedUntil={lockBlockedUntil}
        handleUnlock={handleUnlock}
      />
    );
  }

  return <>{children}</>;
};

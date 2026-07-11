import React from 'react';
import { Lock } from 'lucide-react';
import { useI18n } from '../../lib/i18n';

type AppLockScreenProps = {
  pinInput: string;
  setPinInput: (v: string) => void;
  pinError: boolean;
  lockAttempts: number;
  lockBlockTimer: number;
  lockBlockedUntil: number | undefined;
  handleUnlock: (e?: React.FormEvent) => Promise<void>;
};

export const AppLockScreen: React.FC<AppLockScreenProps> = ({
  pinInput,
  setPinInput,
  pinError,
  lockAttempts,
  lockBlockTimer,
  lockBlockedUntil,
  handleUnlock,
}) => {
  const { t } = useI18n();
  const isBlockedPermanently = lockBlockedUntil === Infinity;
  const isBlockedTemporarily = lockBlockTimer > 0;

  return (
    <div className="w-full h-[100dvh] flex flex-col items-center justify-center font-sans bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="p-8 rounded-md flex flex-col items-center max-w-sm w-full mx-4 shadow-2xl modal-surface">
        <Lock size={48} className="mb-6 text-[var(--accent)]" />
        <h2 className="text-2xl font-bold mb-2 text-center">{t('lock.title')}</h2>
        <p className="text-sm mb-6 text-center text-[var(--text-secondary)]">
          {t('lock.description')}
        </p>

        {isBlockedPermanently ? (
          <div className="text-center mb-4">
            <p className="text-red-500 font-bold text-sm">Too many attempts</p>
            <p className="text-xs mt-1 text-[var(--text-secondary)]">
              App is permanently locked. Recovery required.
            </p>
          </div>
        ) : isBlockedTemporarily ? (
          <div className="text-center mb-4">
            <p className="text-red-500 font-bold text-sm">Locked</p>
            <p className="text-xs mt-1 text-[var(--text-secondary)]">
              Try again in {lockBlockTimer} seconds
            </p>
          </div>
        ) : (
          <form onSubmit={handleUnlock} className="w-full">
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              autoFocus
              className={`w-full text-center tracking-[0.5em] text-2xl font-mono py-4 rounded-md border mb-4 focus:outline-none transition-colors bg-[var(--bg-secondary)] border-[var(--border-color)] focus:border-[var(--accent)]/50 ${pinError ? 'border-red-500 text-red-500' : 'text-[var(--text-primary)]'}`}
              placeholder="****"
            />
            {pinError && (
              <p className="text-xs text-center mb-3 text-red-400">
                Wrong PIN.{' '}
                {lockAttempts >= 2
                  ? `${3 - Math.min(lockAttempts, 3)} attempt(s) remaining`
                  : `${3 - lockAttempts} attempt(s) remaining`}
              </p>
            )}
            <button
              type="submit"
              className="w-full py-4 rounded-md font-bold text-lg transition-transform hover:scale-[1.02] active:scale-95 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg"
            >
              {t('lock.unlock')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

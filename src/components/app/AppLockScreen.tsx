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
  isDark?: boolean;
  handleUnlock: (e?: React.FormEvent) => Promise<void>;
};

export const AppLockScreen: React.FC<AppLockScreenProps> = ({
  pinInput,
  setPinInput,
  pinError,
  lockAttempts,
  lockBlockTimer,
  lockBlockedUntil,
  isDark = true,
  handleUnlock,
}) => {
  const { t } = useI18n();
  const isBlockedPermanently = lockBlockedUntil === Infinity;
  const isBlockedTemporarily = lockBlockTimer > 0;

  return (
    <div className={`w-full h-[100dvh] flex flex-col items-center justify-center font-sans ${isDark ? "bg-[var(--bg-primary)] text-[var(--text-primary)]" : "bg-[var(--bg-secondary)] text-slate-800"}`}>
      <div className={`p-8 rounded-3xl flex flex-col items-center max-w-sm w-full mx-4 shadow-2xl ${isDark ? "bg-[var(--bg-primary)] border border-[var(--border-color)]" : "bg-white border border-[var(--border-color)]"}`}>
        <Lock size={48} className={`mb-6 ${isDark ? "text-orange-500" : "text-orange-600"}`} />
        <h2 className="text-2xl font-bold mb-2 text-center">{t('lock.title')}</h2>
        <p className={`text-sm mb-6 text-center ${isDark ? "text-gray-400" : "text-slate-500"}`}>
          {t('lock.description')}
        </p>

        {isBlockedPermanently ? (
          <div className="text-center mb-4">
            <p className="text-red-500 font-bold text-sm">{t('lock.tooManyAttempts')}</p>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              {t('lock.permanentlyLocked')}
            </p>
          </div>
        ) : isBlockedTemporarily ? (
          <div className="text-center mb-4">
            <p className="text-red-500 font-bold text-sm">{t('lock.locked')}</p>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              {t('lock.tryAgainIn', { seconds: lockBlockTimer })}
            </p>
          </div>
        ) : (
          <form onSubmit={handleUnlock} className="w-full">
            <label htmlFor="app-lock-pin-input" className="sr-only">{t('lock.enterPin') || 'PIN'}</label>
            <input
              id="app-lock-pin-input"
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              autoFocus
              autoComplete="current-password"
              inputMode="numeric"
              aria-invalid={pinError}
              aria-describedby={pinError ? 'app-lock-pin-error' : undefined}
              className={`w-full text-center tracking-[0.5em] text-2xl font-mono py-4 rounded-xl border mb-4 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-colors ${
                isDark
                  ? "bg-[var(--bg-secondary)] border-[var(--border-color)]"
                  : "bg-[var(--bg-primary)] border-[var(--border-color)]"
              } ${pinError ? "border-red-500 text-red-500" : ""}`}
              placeholder="****"
            />
            {pinError && (
              <p id="app-lock-pin-error" role="alert" className={`text-xs text-center mb-3 ${isDark ? 'text-red-400' : 'text-red-500'}`}>
                {t('lock.wrongPin', { remaining: lockAttempts >= 2 ? 3 - Math.min(lockAttempts, 3) : 3 - lockAttempts })}
              </p>
            )}
            <button
              type="submit"
              className={`w-full py-4 rounded-xl font-bold text-lg transition-transform active:scale-95 ${
                isDark
                  ? "bg-gradient-to-r from-orange-600 to-amber-600 text-[var(--text-primary)] shadow-lg"
                  : "bg-gradient-to-r from-orange-500 to-amber-500 text-[var(--text-primary)] shadow-lg"
              }`}
            >
              {t('lock.unlock')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};





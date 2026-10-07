import { useState, useEffect } from 'react';
import { SettingsGroup, SettingsSectionTitle, SettingsToggleRow } from '../../ui/SettingsRow';
import { toast } from 'sonner';
import { useAppStore } from '../../../store';
import { generateSecret, verifyTotp, otpauthUri, totpCode } from '../../../lib/twoFactor';
import { useSecurityChallenge } from '../../../hooks/useSecurityChallenge';
import { SecurityChallengeModal } from './SecurityChallengeModal';

interface TwoFactorPanelProps {
  isDark?: boolean;
  t: (key: string, fallback?: string) => string;
}

export const TwoFactorPanel = ({ isDark = false, t }: TwoFactorPanelProps) => {
  const twoFactor = useAppStore(s => s.twoFactor);
  const setTwoFactor = useAppStore(s => s.setTwoFactor);
  const setTotpSecret = useAppStore(s => s.setTotpSecret);
  const [showTotpSetup, setShowTotpSetup] = useState(false);
  const [totpDraftSecret, setTotpDraftSecret] = useState('');
  const [totpInput, setTotpInput] = useState('');
  const [totpBusy, setTotpBusy] = useState(false);
  const [totpCodeNow, setTotpCodeNow] = useState('');
  const { challenge, require } = useSecurityChallenge();

  useEffect(() => {
    if (!showTotpSetup || !totpDraftSecret) {
      setTotpCodeNow('');
      return;
    }
    let mounted = true;
    let timer: ReturnType<typeof setInterval>;
    const refresh = () => {
      totpCode(totpDraftSecret).then((code) => { if (mounted) setTotpCodeNow(code); }).catch(() => {});
    };
    refresh();
    timer = setInterval(refresh, 1000);
    return () => { mounted = false; clearInterval(timer); };
  }, [showTotpSetup, totpDraftSecret]);

  const openTotpSetup = () => {
    setTotpDraftSecret(generateSecret());
    setTotpInput('');
    setShowTotpSetup(true);
  };

  const confirmTotpSetup = async () => {
    if (totpBusy) return;
    if (totpInput.length !== 6) {
      toast.error(t('settings.totpInvalid'));
      return;
    }
    setTotpBusy(true);
    try {
      const ok = await verifyTotp(totpDraftSecret, totpInput);
      if (!ok) {
        toast.error(t('settings.totpInvalid'));
        setTotpInput('');
        return;
      }
      setTotpSecret(totpDraftSecret);
      setTwoFactor(true);
      setShowTotpSetup(false);
      setTotpInput('');
      toast.success(t('settings.totpEnabled'));
    } finally {
      setTotpBusy(false);
    }
  };

  const disableTwoFactor = () => {
    // Dropping the second factor is as sensitive as enabling it, so it needs the
    // app-lock PIN first. `pin`, not `strong`: the `strong` level would demand
    // the very code whose removal is being requested.
    const started = require({
      level: 'pin',
      title: t('lock.stepUpTitle', "Confirm it's you"),
      message: t('lock.stepUpDisableTwoFactor'),
      onVerified: () => {
        setTwoFactor(false);
        setTotpSecret(null);
        toast.success(t('settings.totpDisabled'));
      },
    });
    if (!started) toast.error(t('lock.setupPinForTwoFactor', 'Set an app-lock PIN first — it is required to disable two-factor authentication'));
  };

  return (
    <>
      <SettingsSectionTitle title={t('settings.twoFactor')} isDark={isDark} />
      <SettingsGroup isDark={isDark} className="mb-6">
        <SettingsToggleRow
          title={t('settings.twoFactorAuth')}
          subtitle={t('settings.twoFactorSubtitle')}
          isOn={twoFactor}
          onToggle={() => {
            if (twoFactor) disableTwoFactor();
            else openTotpSetup();
          }}
          isDark={isDark}
        />
        {showTotpSetup && (
          <div className="px-4 py-3 border-t border-[var(--border-color)] dark:border-[var(--border-color)]">
            <p className={`text-xs mb-3 ${isDark ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]"}`}>
              {t('settings.totpInstruction')}
            </p>
            <label htmlFor="security-totp-secret" className={`block text-xs font-medium mb-1 text-[var(--text-secondary)]`}>
              {t('settings.totpSecretLabel')}
            </label>
            <div
              id="security-totp-secret"
              className={`w-full px-3 py-2 rounded-lg text-[11px] font-mono break-all border ${isDark ? "bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)]" : "bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-secondary)]"}`}
            >
              {totpDraftSecret}
            </div>
            <p className={`text-[11px] font-mono break-all mt-1 ${isDark ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]"}`}>
              {otpauthUri(totpDraftSecret, useAppStore.getState().userProfile?.name || 'user')}
            </p>
            {totpCodeNow && (
              <p className={`text-xs mt-2 ${isDark ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]"}`}>
                {t('settings.totpCurrentCode')}: <span className="font-mono font-semibold">{totpCodeNow}</span>
              </p>
            )}
            <label htmlFor="security-totp-input" className={`block text-xs font-medium mt-3 mb-1 text-[var(--text-secondary)]`}>
              {t('settings.totpSecretLabel')}
            </label>
            <input
              id="security-totp-input"
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              value={totpInput}
              onChange={e => setTotpInput(e.target.value.replace(/[^0-9]/g, ''))}
              onKeyDown={e => e.key === 'Enter' && confirmTotpSetup()}
              placeholder={t('settings.totpPlaceholder')}
              className={`w-full px-3 py-2 rounded-lg text-sm text-center tracking-[0.4em] font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-colors border ${isDark ? "bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)]" : "bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)]"}`}
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={confirmTotpSetup}
                disabled={totpBusy}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${isDark ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30" : "bg-amber-100 text-amber-700 hover:bg-amber-200"}`}
              >
                {t('settings.verify')}
              </button>
              <button
                type="button"
                onClick={() => { setShowTotpSetup(false); setTotpInput(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${isDark ? "bg-white/10 text-[var(--text-primary)] hover:bg-white/20" : "bg-black/5 text-[var(--text-secondary)] hover:bg-black/10"}`}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}
      </SettingsGroup>
      <SecurityChallengeModal {...challenge} isDark={isDark} t={t} />
    </>
  );
};
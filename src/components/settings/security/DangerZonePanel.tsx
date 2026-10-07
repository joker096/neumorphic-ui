import { Trash2 } from 'lucide-react';
import { SettingsRow, SettingsGroup, SettingsSectionTitle } from '../../ui/SettingsRow';
import { toast } from 'sonner';
import { cryptoCore } from '../../../lib/crypto/cryptoCore';
import { useSecurityChallenge } from '../../../hooks/useSecurityChallenge';
import { SecurityChallengeModal } from './SecurityChallengeModal';

interface DangerZonePanelProps {
  isDark?: boolean;
  t: (key: string, fallback?: string) => string;
}

/**
 * Irreversible actions.
 *
 * "Wipe all data" and "Delete account" used to be two rows calling the same
 * `cryptoCore.secureWipe()` — the app identity *is* the account (master seed
 * lives in the same storage), so there is no honest difference between the
 * two. They are collapsed into one control, and it now requires a `strong`
 * step-up challenge (PIN, plus the 2FA code when two-factor is enabled)
 * before anything is erased.
 */
export const DangerZonePanel = ({ isDark = false, t }: DangerZonePanelProps) => {
  const { challenge, require } = useSecurityChallenge();

  const handleDeleteAccount = async () => {
    try {
      await cryptoCore.secureWipe();
      toast.success(t('settings.accountDeleted'));
    } catch {
      toast.error(t('settings.wipeFailed'));
    }
  };

  const requestDelete = () => {
    const started = require({
      level: 'strong',
      title: t('lock.stepUpTitle', "Confirm it's you"),
      message: t('settings.confirmDeleteAccount'),
      onVerified: handleDeleteAccount,
    });
    if (!started) toast.error(t('lock.setupPinFirst'));
  };

  return (
    <>
      <SettingsSectionTitle title={t('settings.dangerZone')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        <SettingsRow
          icon={<Trash2 size={16} />}
          iconBg={isDark ? "bg-red-500/10" : "bg-red-100"}
          iconColor={isDark ? "text-red-400" : "text-red-600"}
          title={t('settings.deleteAccount')}
          subtitle={t('settings.deleteAccountSubtitle')}
          isDark={isDark}
          onClick={requestDelete}
        />
      </SettingsGroup>

      <SecurityChallengeModal {...challenge} isDark={isDark} t={t} />
    </>
  );
};
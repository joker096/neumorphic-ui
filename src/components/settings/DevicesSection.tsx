import { useMemo, useState } from 'react';
import { Clock, Monitor, X } from 'lucide-react';
import { SettingsRow, SettingsGroup, SettingsSectionTitle } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';
import { toast } from 'sonner';
import { ConfirmModal } from './ConfirmModal';
import { cryptoCore } from '../../lib/crypto/cryptoCore';

function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('OPR/')) return 'Opera';
  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('Chrome/')) return 'Chrome';
  if (ua.includes('Safari/')) return 'Safari';
  return 'Browser';
}

interface DevicesSectionProps {
  isDark?: boolean;
  onBack: () => void;
  t: (key: string, fallback?: string) => string;
}

export const DevicesSection = ({ isDark = false, onBack, t }: DevicesSectionProps) => {
  const [showTerminateCurrent, setShowTerminateCurrent] = useState(false);
  const deviceInfo = useMemo(() => `${detectBrowser()} • ${navigator.platform || 'Web'}`, []);

  const handleTerminateCurrent = async () => {
    setShowTerminateCurrent(false);
    try {
      await cryptoCore.secureWipe();
      toast.success(t('settings.sessionTerminated', 'Session ended'));
    } catch {
      toast.error(t('settings.wipeFailed', 'Wipe failed'));
    }
  };

  return (
    <SubView title={t('settings.devices', 'Devices')} isDark={isDark} onBack={onBack}>
      <SettingsSectionTitle title={t('settings.thisDevice', 'This device')} isDark={isDark} />
      <SettingsGroup isDark={isDark} className="mb-6">
        <SettingsRow
          icon={<Monitor size={16} />}
          iconBg={isDark ? "bg-emerald-500/10" : "bg-emerald-100"}
          iconColor={isDark ? "text-emerald-400" : "text-emerald-600"}
          title={t('settings.thisDevice', 'This device')}
          subtitle={deviceInfo}
          isDark={isDark}
        />
        <SettingsRow
          icon={<Clock size={16} />}
          iconBg={isDark ? "bg-emerald-500/10" : "bg-emerald-100"}
          iconColor={isDark ? "text-emerald-400" : "text-emerald-600"}
          title={t('settings.lastActive', 'Last active')}
          subtitle={t('settings.lastActiveNow', 'Just now')}
          isDark={isDark}
        />
        <SettingsRow
          icon={<X size={16} />}
          iconBg={isDark ? "bg-red-500/10" : "bg-red-100"}
          iconColor={isDark ? "text-red-400" : "text-red-600"}
          title={t('settings.terminateSession', 'Terminate session')}
          subtitle={t('settings.terminateCurrentSubtitle', 'End this session and wipe local data')}
          isDark={isDark}
          onClick={() => setShowTerminateCurrent(true)}
        />
      </SettingsGroup>

      <ConfirmModal
        isOpen={showTerminateCurrent}
        title={t('settings.terminateSession', 'Terminate session')}
        message={t('settings.confirmTerminateCurrent', 'End the session on this device? Local data will be wiped.')}
        confirmLabel={t('settings.terminate', 'Terminate')}
        cancelLabel={t('common.cancel')}
        variant="danger"
        isDark={isDark}
        onConfirm={handleTerminateCurrent}
        onCancel={() => setShowTerminateCurrent(false)}
      />
    </SubView>
  );
};

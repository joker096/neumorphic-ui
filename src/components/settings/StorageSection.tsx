import { Trash2, Shield } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { SettingsRow, SettingsGroup, SettingsSectionTitle } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';

interface StorageSectionProps {
  isDark?: boolean;
  onBack: () => void;
}

export const StorageSection = ({ isDark = false, onBack }: StorageSectionProps) => {
  const { t } = useI18n();

  const handleClearCache = () => {
    try {
      if (typeof caches !== 'undefined') {
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
      }
    } catch {
      // ignore
    }
  };

  return (
    <SubView title={t('settings.dataStorage')} isDark={isDark} onBack={onBack}>
      <SettingsSectionTitle title={t('settings.storageSecuritySection', 'Storage')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        <SettingsRow
          icon={<Shield size={16} />}
          iconBg={isDark ? "bg-emerald-500/10" : "bg-emerald-100"}
          iconColor={isDark ? "text-emerald-400" : "text-emerald-600"}
          title={t('settings.localEncryption', 'Local encryption at rest')}
          subtitle={t('settings.localEncryptionSubtitle', 'AES-256-GCM for all local data')}
          isDark={isDark}
          value={t('settings.enabled', 'On')}
        />
        <SettingsRow
          icon={<Trash2 size={16} />}
          iconBg={isDark ? "bg-rose-500/10" : "bg-rose-100"}
          iconColor={isDark ? "text-rose-400" : "text-rose-600"}
          title={t('settings.clearCache', 'Clear cache')}
          subtitle={t('settings.clearCacheSubtitle', 'Remove downloaded media and temporary data')}
          isDark={isDark}
          onClick={handleClearCache}
        />
      </SettingsGroup>
    </SubView>
  );
};

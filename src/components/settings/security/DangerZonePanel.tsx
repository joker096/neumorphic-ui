import { useState } from 'react';
import { Shield, Trash2 } from 'lucide-react';
import { SettingsRow, SettingsGroup, SettingsSectionTitle } from '../../ui/SettingsRow';
import { toast } from 'sonner';
import { ConfirmModal } from '../ConfirmModal';
import { cryptoCore } from '../../../lib/crypto/cryptoCore';

interface DangerZonePanelProps {
  isDark?: boolean;
  t: (key: string, fallback?: string) => string;
}

export const DangerZonePanel = ({ isDark = false, t }: DangerZonePanelProps) => {
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleWipeData = () => {
    setShowWipeConfirm(true);
  };

  const handleConfirmWipe = async () => {
    setShowWipeConfirm(false);
    try {
      await cryptoCore.secureWipe();
      toast.success(t('settings.dataWiped'));
    } catch {
      toast.error(t('settings.wipeFailed'));
    }
  };

  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
    try {
      await cryptoCore.secureWipe();
      toast.success(t('settings.accountDeleted'));
    } catch {
      toast.error(t('settings.wipeFailed'));
    }
  };

  return (
    <>
      <SettingsSectionTitle title={t('settings.dangerZone')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        <SettingsRow
          icon={<Shield size={16} />}
          iconBg={isDark ? "bg-red-500/10" : "bg-red-100"}
          iconColor={isDark ? "text-red-400" : "text-red-600"}
          title={t('settings.wipeAllData')}
          subtitle={t('settings.wipeSubtitle')}
          isDark={isDark}
          onClick={handleWipeData}
        />
        <SettingsRow
          icon={<Trash2 size={16} />}
          iconBg={isDark ? "bg-red-500/10" : "bg-red-100"}
          iconColor={isDark ? "text-red-400" : "text-red-600"}
          title={t('settings.deleteAccount')}
          subtitle={t('settings.deleteAccountSubtitle')}
          isDark={isDark}
          onClick={() => setShowDeleteConfirm(true)}
        />
      </SettingsGroup>

      <ConfirmModal
        isOpen={showWipeConfirm}
        title={t('settings.wipeAllData')}
        message={t('settings.confirmWipe')}
        confirmLabel={t('settings.wipeAllData')}
        cancelLabel={t('common.cancel')}
        variant="danger"
        onConfirm={handleConfirmWipe}
        onCancel={() => setShowWipeConfirm(false)}
      />

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title={t('settings.deleteAccount')}
        message={t('settings.confirmDeleteAccount')}
        confirmLabel={t('settings.deleteAccount')}
        cancelLabel={t('common.cancel')}
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
};
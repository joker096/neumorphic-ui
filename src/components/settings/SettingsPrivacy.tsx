import React from 'react';
import { useI18n } from '../../lib/i18n';

export const SettingsPrivacy: React.FC = () => {
  const { t } = useI18n();
  return (
    <div className="p-4 text-white/80 text-sm">
      <h2 className="text-lg font-bold mb-4">{t('settings.privacySecuritySection')}</h2>
      <p className="text-gray-500">{t('settings.privacySubView')}</p>
    </div>
  );
};

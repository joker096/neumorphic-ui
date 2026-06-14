import React from 'react';
import { useI18n } from '../../lib/i18n';

export const SettingsNetwork: React.FC = () => {
  const { t } = useI18n();
  return (
    <div className="p-4 text-white/80 text-sm">
      <h2 className="text-lg font-bold mb-4">{t('settings.network')}</h2>
      <p className="text-gray-500">{t('settings.networkSubtitle')}</p>
    </div>
  );
};

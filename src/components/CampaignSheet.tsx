import React from 'react';
import { useAppStore } from '../store';
import { useI18n } from '../lib/i18n';

export const CampaignSheet = () => {
  const contacts = useAppStore((state) => state.contacts);
  const { t } = useI18n();

  return (
    <div className="p-4 space-y-3">
      <div className="rounded-2xl border border-white/10 bg-[#1a1d24] p-4">
        <h2 className="text-lg font-bold text-white">{t('campaignSheet.title')}</h2>
        <p className="text-sm text-gray-400 mt-1">{t('campaignSheet.description')}</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#1a1d24] divide-y divide-white/5">
        {contacts.slice(0, 20).map((contact) => (
          <div key={contact.id} className="flex items-center justify-between p-3">
            <div>
              <div className="text-sm text-white">{contact.name}</div>
              <div className="text-xs text-gray-400">
                {contact.profileShare && typeof contact.profileShare === 'object' ? contact.profileShare.state : 'idle'}
             </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

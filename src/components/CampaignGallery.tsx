import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { useI18n } from '../lib/i18n';
import type { Contact } from '../types/contact';
import { checkRateLimit, applyRateLimit, getParticipantsForChannel, canApplyCampaign, adminPauseState } from '../utils/riskShell';
import { registerRiskSession, getLastActionDebugId } from '../utils/riskShell';

export const CampaignGallery = () => {
  const { t } = useI18n();
  const contacts = useAppStore((state) => state.contacts);
  const channels = useAppStore((state) => state.channels);
  const setContacts = useAppStore((state) => state.setContacts);
  const riskShellActive = useAppStore((state) => state.riskShellActive);
  const adminPausedAt = useAppStore((state) => state.adminPausedAt);

  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

  const campaigns = useMemo(() => {
    const map = new Map<string, Contact[]>();
    channels.forEach((channel: any) => {
      const participants = getParticipantsForChannel(channel.channelId || channel.id, contacts as Contact[]);
      map.set(channel.channelId || channel.id, participants);
    });
    return map;
  }, [channels, contacts]);

  const handleApply = (contact: Contact) => {
    if (riskShellActive && contact.id) {
      registerRiskSession(contact.id, getLastActionDebugId(contact.id));
      return;
    }
    if (!canApplyCampaign(contact)) return;
    if (!checkRateLimit(contact.id)) return;
    applyRateLimit(contact.id);
setContacts((prev: Contact[]) =>
       prev.map((c) =>
         c.id === contact.id
           ? {
               ...c,
               profileShare: typeof c.profileShare === 'object' && c.profileShare !== null
                 ? { ...c.profileShare, state: 'sent', updatedAt: Date.now() }
                 : { state: 'sent', updatedAt: Date.now() },
             }
           : c,
       ),
     );
  };

  const handleRetry = (contact: Contact) => {
    if (riskShellActive && contact.id) {
      registerRiskSession(contact.id, getLastActionDebugId(contact.id));
      return;
    }
setContacts((prev: Contact[]) =>
       prev.map((c) =>
         c.id === contact.id
           ? {
               ...c,
               profileShare: typeof c.profileShare === 'object' && c.profileShare !== null
                 ? { ...c.profileShare, state: 'sending', updatedAt: Date.now() }
                 : { state: 'sending', updatedAt: Date.now() },
             }
           : c,
       ),
     );
  };

  const handleClear = (contact: Contact) => {
    if (riskShellActive && contact.id) {
      registerRiskSession(contact.id, getLastActionDebugId(contact.id));
      return;
    }
    setContacts((prev: Contact[]) => prev.map((c) => (c.id === contact.id ? { ...c, profileShare: undefined } : c)));
  };

  return (
    <div className="p-4 space-y-4">
      <div className="rounded-2xl border border-white/10 bg-[#1a1d24] p-4">
        <h2 className="text-lg font-bold text-white">{t('campaigns.title')}</h2>
        <p className="text-sm text-gray-400 mt-1">{t('campaigns.description')}</p>
      </div>
      {Array.from(campaigns.entries()).map(([channelId, participants]) => (
        <div key={channelId} className="rounded-2xl border border-white/10 bg-[#1a1d24] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-white">{channelId}</div>
            <div className="text-xs text-gray-400">{t('campaigns.participants')}: {participants.length}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {participants.map((contact) => {
              const stateLabel = (typeof contact.profileShare === 'object' && contact.profileShare ? contact.profileShare.state : undefined) || 'idle';
              const isPaused = adminPauseState(channelId, contacts as Contact[]).paused;
              return (
                <div key={contact.id} className="rounded-xl border border-white/5 bg-white/5 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-white">{contact.name}</div>
                    {isPaused && <span className="text-[10px] uppercase tracking-wider text-yellow-400">{t('campaigns.paused')}</span>}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">{stateLabel}</div>
                  <div className="flex items-center gap-2 mt-2">
                    {canApplyCampaign(contact) && (
                      <button onClick={() => handleApply(contact)} className="px-3 py-1.5 rounded-xl bg-white/10 text-white text-[11px] font-semibold">
                        {t('campaigns.apply')}
                      </button>
                    )}
                    <button onClick={() => handleRetry(contact)} className="px-3 py-1.5 rounded-xl bg-white/10 text-white text-[11px] font-semibold">
                      {t('campaigns.retry')}
                    </button>
                    <button onClick={() => handleClear(contact)} className="px-3 py-1.5 rounded-xl bg-white/10 text-white text-[11px] font-semibold">
                      {t('campaigns.clear')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

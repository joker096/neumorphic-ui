import React, { useMemo, useState, useEffect } from 'react';
import { useI18n } from '../lib/i18n';
import { useAppStore } from '../store';
import { MOCK_COMPANY_MEMBERS, MOCK_COMPANY_CHANNELS, MOCK_COMPANY_ID } from '../constants';
import { CompanyHeader } from './company/CompanyHeader';
import { CompanyInfoCard } from './company/CompanyInfoCard';
import { MemberList } from './company/MemberList';
import { ChannelList } from './company/ChannelList';
import { CompanySettingsView } from './company/CompanySettingsView';
import { Scanner } from '@yudiel/react-qr-scanner';
import { motion, AnimatePresence } from 'motion/react';
import { X, QrCode } from 'lucide-react';

const closeBtn = (onClick: () => void) => (
  <button
    onClick={onClick}
    className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all bg-black/5 hover:bg-black/10 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
  >
    <X size={18} />
  </button>
);

type CompanyContactsViewProps = {
  onCall?: (name: string, color?: string) => void;
  onVideoCall?: (name: string, color?: string) => void;
  onMessage?: (name: string, color?: string) => void;
  theme?: 'dark' | 'light';
};

export const CompanyContactsView = ({ onCall, onVideoCall, onMessage, theme }: CompanyContactsViewProps) => {
  const isDark = theme === 'dark';
  const { t } = useI18n();
  const companyMembers = useAppStore(state => state.companyMembers);
  const companyChannels = useAppStore(state => state.companyChannels);
  const companyId = useAppStore(state => state.companyId);
  const setCompanyMembers = useAppStore(state => state.setCompanyMembers);
  const setCompanyChannels = useAppStore(state => state.setCompanyChannels);
  const setCompanyId = useAppStore(state => state.setCompanyId);
  const loadCompanySettings = useAppStore(state => state.loadCompanySettings);
  const hideWhenOfficeOnly = useAppStore(state => state.hideWhenOfficeOnly);
  const connectionStatus = useAppStore(state => state.connectionStatus);
  const companySettings = useAppStore(state => state.companySettings);
  const [showScanQR, setShowScanQR] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!companySettings) {
      loadCompanySettings();
    }
  }, []);

  const isInOffice = connectionStatus === 'connected';
  const shouldHideCompany = hideWhenOfficeOnly && !isInOffice;

  if (shouldHideCompany) {
    return null;
  }

  const displayMembers = companyMembers.length > 0 ? companyMembers : MOCK_COMPANY_MEMBERS;
  const displayChannels = companyChannels.length > 0 ? companyChannels : MOCK_COMPANY_CHANNELS;

  const handleScanQR = () => {
    setShowScanQR(true);
  };

  const handleInvite = () => {
    setShowInvite(true);
  };

  const handleSettings = () => {
    setShowSettings(true);
  };

  const handleJoinCompanyFromQR = (scannedData: string) => {
    if (!companyId) {
      setCompanyId(MOCK_COMPANY_ID);
      setCompanyMembers(MOCK_COMPANY_MEMBERS);
      setCompanyChannels(MOCK_COMPANY_CHANNELS);
      loadCompanySettings();
    }
    setShowScanQR(false);
  };

  const totalUnread = useMemo(() =>
    displayChannels.reduce((sum, c) => sum + (c.unread || 0), 0),
    [displayChannels],
  );

  return (
    <div className="w-full flex-1 flex flex-col overflow-y-auto px-3 md:px-5 py-3 md:py-5">
      <CompanyHeader isDark={isDark} onScanQR={handleScanQR} onInvite={handleInvite} onSettings={handleSettings} />
      <CompanyInfoCard
        isDark={isDark}
        connected={t('company.connected') || 'Connected'}
      />
      <MemberList
        isDark={isDark}
        members={displayMembers}
        onCall={onCall}
        onVideoCall={onVideoCall}
        onMemberClick={(member, color) => onMessage?.(member.displayName, color)}
        teamMembersLabel={t('company.teamMembers') || 'Team Members'}
        t={t}
      />
      <ChannelList
        isDark={isDark}
        channels={displayChannels}
        channelsLabel={t('company.channels') || 'Company Channels'}
        t={t}
        onChannelClick={(channel) => onMessage?.(channel.name, 'from-blue-400 to-indigo-500')}
      />

      <AnimatePresence>
        {showScanQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowScanQR(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[340px] md:max-w-[400px] lg:max-w-[440px] p-6 shadow-2xl relative modal-surface"
            >
              {closeBtn(() => setShowScanQR(false))}
              <h3 className="text-xl font-bold mb-6 text-[var(--text-primary)]">{t('company.scanQR') || 'Scan QR to Join'}</h3>
              <div className="w-full aspect-square overflow-hidden relative shadow-inner bg-gray-100">
                <Scanner
                  onScan={(result) => {
                    if (result && result.length > 0) {
                      handleJoinCompanyFromQR(result[0].rawValue);
                    }
                  }}
                  styles={{ container: { width: '100%', height: '100%' } }}
                />
                <div className="absolute inset-0 border-4 border-orange-500/50 pointer-events-none mix-blend-overlay"></div>
              </div>
              <p className="text-xs text-center mt-6 text-[var(--text-secondary)]">{t('company.scanDescription') || 'Point camera at company QR code'}</p>
            </motion.div>
          </motion.div>
        )}

        {showInvite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowInvite(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[340px] md:max-w-[400px] p-6 shadow-2xl relative flex flex-col items-center modal-surface"
            >
              {closeBtn(() => setShowInvite(false))}
              <h3 className="text-xl font-bold mb-4 text-[var(--text-primary)]">{t('company.invite') || 'Invite Members'}</h3>
              <p className="text-sm text-center mb-4 text-[var(--text-secondary)]">{t('company.inviteDescription') || 'Share this QR code with team members'}</p>
              <div className={`w-full max-w-[200px] aspect-square flex items-center justify-center p-4 shadow-xl mb-4 ${isDark ? "bg-[var(--bg-tertiary)]" : "bg-white"}`}>
                  <QrCode size="100%" strokeWidth={1} className={isDark ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"} />
              </div>
              <div className="w-full p-4 rounded-md flex flex-col items-center gap-3 neu-card-inset">
                <div className="font-mono text-xs tracking-widest break-all text-center text-[var(--accent)]">
                  {MOCK_COMPANY_ID}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSettings(false)}
          >
            <CompanySettingsView onClose={() => setShowSettings(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};





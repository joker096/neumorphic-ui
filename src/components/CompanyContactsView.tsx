import React, { useMemo, useState } from 'react';
import { useI18n } from '../lib/i18n';
import { useAppStore } from '../store';
import { MOCK_COMPANY_MEMBERS, MOCK_COMPANY_CHANNELS, MOCK_COMPANY_ID } from '../constants';
import { CompanyHeaderUI } from './company/CompanyHeader';
import { CompanyInfoCard } from './company/CompanyInfoCard';
import { MemberList } from './company/MemberList';
import { ChannelList } from './company/ChannelList';
import { Scanner } from '@yudiel/react-qr-scanner';
import { motion, AnimatePresence } from 'motion/react';
import { X, QrCode } from 'lucide-react';

type CompanyContactsViewProps = {
  theme: 'light' | 'dark';
  onCall?: (name: string, color?: string) => void;
  onVideoCall?: (name: string, color?: string) => void;
  onMessage?: (name: string, color?: string) => void;
};

export const CompanyContactsView = ({ theme, onCall, onVideoCall, onMessage }: CompanyContactsViewProps) => {
  const isDark = theme === 'dark';
  const { t } = useI18n();
  const companyMembers = useAppStore(state => state.companyMembers);
  const companyChannels = useAppStore(state => state.companyChannels);
  const companyId = useAppStore(state => state.companyId);
  const setCompanyMembers = useAppStore(state => state.setCompanyMembers);
  const setCompanyChannels = useAppStore(state => state.setCompanyChannels);
  const setCompanyId = useAppStore(state => state.setCompanyId);
  const hideWhenOfficeOnly = useAppStore(state => state.hideWhenOfficeOnly);
  const connectionStatus = useAppStore(state => state.connectionStatus);
  const [showScanQR, setShowScanQR] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

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

  const handleJoinCompanyFromQR = (scannedData: string) => {
    if (!companyId) {
      setCompanyId(MOCK_COMPANY_ID);
      setCompanyMembers(MOCK_COMPANY_MEMBERS);
      setCompanyChannels(MOCK_COMPANY_CHANNELS);
    }
    setShowScanQR(false);
  };

  const totalUnread = useMemo(() =>
    displayChannels.reduce((sum, c) => sum + (c.unread || 0), 0),
    [displayChannels],
  );

  return (
    <div className={`w-full max-w-[500px] md:max-w-[600px] flex-1 flex flex-col items-center p-4 md:p-5 mb-8 pb-[calc(56px+env(safe-area-inset-bottom,0px))] sm:pb-8 overflow-y-auto ${isDark ? "bg-[#11141c]/50 border border-white/5" : "bg-[#eaeff4]/50 border border-black/5 shadow-inner"}`}>
      <CompanyHeaderUI isDark={isDark} onScanQR={handleScanQR} onInvite={handleInvite} />
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
      />

      <AnimatePresence>
        {showScanQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
  className={`w-full max-w-[340px] md:max-w-[400px] lg:max-w-[440px] p-6 shadow-2xl relative ${isDark ? "bg-[#1a1d24] border border-white/10" : "bg-white border border-black/10"}`}
            >
              <button
                onClick={() => setShowScanQR(false)}
                className={`absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors ${isDark ? "bg-white/10 hover:bg-white/20 text-white" : "bg-black/5 hover:bg-black/10 text-slate-800"}`}
              >
                <X size={18} />
              </button>
              <h3 className={`text-xl font-bold mb-6 ${isDark ? "text-white" : "text-slate-800"}`}>{t('company.scanQR') || 'Scan QR to Join'}</h3>
              <div className={`w-full aspect-square overflow-hidden relative shadow-inner ${isDark ? "bg-black" : "bg-gray-100"}`}>
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
              <p className={`text-xs text-center mt-6 ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('company.scanDescription') || 'Point camera at company QR code'}</p>
            </motion.div>
          </motion.div>
        )}

        {showInvite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
 className={`w-full max-w-[340px] md:max-w-[400px] p-6 shadow-2xl relative flex flex-col items-center ${isDark ? "bg-[#1a1d24] border border-white/10 text-white" : "bg-white border border-black/10 text-slate-800"}`}
            >
              <button
                onClick={() => setShowInvite(false)}
                className={`absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors ${isDark ? "bg-white/10 hover:bg-white/20 text-white" : "bg-black/5 hover:bg-black/10 text-slate-800"}`}
              >
                <X size={18} />
              </button>
              <h3 className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-800"}`}>{t('company.invite') || 'Invite Members'}</h3>
              <p className={`text-sm text-center mb-4 ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('company.inviteDescription') || 'Share this QR code with team members'}</p>
              <div className={`w-full max-w-[200px] aspect-square flex items-center justify-center p-4 shadow-xl mb-4 ${isDark ? "bg-white" : "bg-white border-2 border-gray-100"}`}>
                <QrCode size="100%" strokeWidth={1} className="text-black" />
              </div>
              <div className={`w-full p-4 rounded-2xl flex flex-col items-center gap-3 ${isDark ? "bg-[#13151b] border border-white/5" : "bg-slate-50 border border-black/5"}`}>
                <div className={`font-mono text-xs tracking-widest break-all text-center ${isDark ? "text-orange-400" : "text-orange-600"}`}>
                  {MOCK_COMPANY_ID}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

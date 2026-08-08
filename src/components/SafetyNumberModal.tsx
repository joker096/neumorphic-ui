import { motion, AnimatePresence } from 'motion/react';
import { useI18n } from '../lib/i18n';
import { computeSafetyNumber, computeVerificationLevel, getVerificationColor } from '../lib/crypto/safetyNumber';
import { useEffect, useState } from 'react';
import { AppModal } from './ui/AppModal';

interface SafetyNumberModalProps {
  open: boolean;
  contactId: string;
  contactName: string;
  myPeerId?: string;
  theme: 'light' | 'dark';
  onClose: () => void;
}

export const SafetyNumberModal = ({ open, contactId, contactName, myPeerId, theme, onClose }: SafetyNumberModalProps) => {
  const isDark = theme === 'dark';
  const { t } = useI18n();
  const [safetyNumber, setSafetyNumber] = useState('');
  const [verifyLevel, setVerifyLevel] = useState(0);

  useEffect(() => {
    if (open && myPeerId) {
      computeSafetyNumber(myPeerId, contactId).then(setSafetyNumber);
    }
  }, [open, myPeerId, contactId]);

  useEffect(() => {
    if (safetyNumber) {
      setVerifyLevel(computeVerificationLevel(safetyNumber));
    }
  }, [safetyNumber]);

  return (
    <AppModal isOpen={open} onClose={onClose} isDark={isDark} title={t('contacts.safetyNumbersTitle')} maxWidth="max-w-sm">
      <p className={`text-xs mb-4 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
        {t('contacts.safetyNumbersDesc', { name: contactName })}
      </p>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mb-4">
        {safetyNumber.split(' ').map((g, i) => (
          <span key={i} className={`font-mono text-sm tracking-wider px-2 py-0.5 rounded ${isDark ? 'bg-white/5 text-gray-200' : 'bg-black/5 text-slate-700'}`}>{g}</span>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getVerificationColor(verifyLevel) }} />
        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
          {t('contacts.verificationLevel', { level: verifyLevel })}
        </span>
      </div>
      {myPeerId && (
        <div className={`text-[10px] font-mono mb-4 p-2 rounded-lg ${isDark ? 'bg-white/5 text-gray-500' : 'bg-black/5 text-slate-400'}`}>
          {t('contacts.yourId')} {myPeerId.slice(0, 16)}...
          <br />
          {t('contacts.theirId')} {contactId.slice(0, 16)}...
        </div>
      )}
      <button onClick={onClose} className={`w-full h-11 rounded-2xl text-sm font-bold transition-colors active:scale-95 ${isDark ? 'bg-white/10 hover:bg-white/20 text-[var(--text-primary)]' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}>
        {t('contacts.close')}
      </button>
    </AppModal>
  );
};





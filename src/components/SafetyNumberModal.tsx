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
  theirPublicKey?: string;
  theme: 'light' | 'dark';
  onClose: () => void;
}

export const SafetyNumberModal = ({ open, contactId, contactName, myPeerId, theirPublicKey, theme, onClose }: SafetyNumberModalProps) => {
  const isDark = theme === 'dark';
  const { t } = useI18n();
  const [safetyNumber, setSafetyNumber] = useState('');
  const [verifyLevel, setVerifyLevel] = useState(0);

  useEffect(() => {
    if (open && myPeerId && theirPublicKey) {
      computeSafetyNumber(myPeerId, theirPublicKey).then(setSafetyNumber).catch(() => {});
    } else {
      setSafetyNumber('');
    }
  }, [open, myPeerId, theirPublicKey]);

  useEffect(() => {
    if (safetyNumber) {
      setVerifyLevel(computeVerificationLevel(safetyNumber));
    }
  }, [safetyNumber]);

  return (
    <AppModal isOpen={open} onClose={onClose} isDark={isDark} title={t('contacts.safetyNumbersTitle')} maxWidth="max-w-sm">
      <p className="text-xs mb-4 text-[var(--text-secondary)]">
        {t('contacts.safetyNumbersDesc', { name: contactName })}
      </p>
      {safetyNumber && (
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mb-4">
          {safetyNumber.split(' ').map((g, i) => (
            <span key={i} className="font-mono text-sm tracking-wider px-2 py-0.5 rounded bg-black/5 text-[var(--text-primary)] dark:bg-white/5">{g}</span>
          ))}
        </div>
      )}
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getVerificationColor(verifyLevel) }} />
        <span className="text-xs text-[var(--text-secondary)]">
          {t('contacts.verificationLevel', { level: verifyLevel })}
        </span>
      </div>
      {myPeerId && (
        <div className="text-xs font-mono mb-4 p-2 rounded-lg bg-black/5 text-[var(--text-tertiary)] dark:bg-white/5">
          {t('contacts.yourId')} {String(myPeerId).slice(0, 16)}...
          <br />
          {t('contacts.theirId')} {String(theirPublicKey || contactId || '').slice(0, 16)}...
        </div>
      )}
      <button onClick={onClose} className="w-full h-11 rounded-2xl text-sm font-bold transition-colors active:scale-95 bg-black/5 hover:bg-black/10 text-[var(--text-primary)] dark:bg-white/10 dark:hover:bg-white/20">
        {t('contacts.close')}
      </button>
    </AppModal>
  );
};





import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check } from 'lucide-react';
import { QrCode } from '../QrCode';

type InviteQRModalProps = {
  isOpen: boolean;
  onClose: () => void;
  inviteText: string;
  isDark?: boolean;
  t: (key: string) => string;
};

export const InviteQRModal = ({ isOpen, onClose, inviteText, isDark = false, t }: InviteQRModalProps) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCopied(false);
      navigator.clipboard.writeText(inviteText).then(() => {
        setCopied(true);
      }).catch(() => {});
    }
  }, [isOpen, inviteText]);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className={`w-full max-w-[340px] p-6 shadow-2xl relative flex flex-col items-center modal-surface rounded-2xl ${
              isDark
                ? 'bg-[var(--bg-tertiary)] border border-[var(--border-color)]'
                : 'bg-white border border-[var(--border-color)]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className={`absolute top-4 right-4 z-10 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                isDark
                  ? 'bg-white/10 hover:bg-white/20 text-[var(--text-primary)]'
                  : 'bg-black/5 hover:bg-black/10 text-slate-800'
              }`}
            >
              <X size={18} />
            </button>

            <h3 className={`text-xl font-bold mb-2 text-center ${isDark ? 'text-[var(--text-primary)]' : 'text-slate-800'}`}>
              {t('onboarding.invite') || 'Invite friends'}
            </h3>
            <p className={`text-sm text-center mb-4 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              {t('onboarding.inviteDescription') || 'Scan this QR code or copy the link to invite friends'}
            </p>

            <div className={`w-[200px] h-[200px] flex items-center justify-center p-4 shadow-xl mb-4 rounded-xl ${
              isDark ? 'bg-white' : 'bg-white border-2 border-gray-100'
            }`}>
              <QrCode data={inviteText} size={180} />
            </div>

            <div className={`w-full p-4 rounded-md flex flex-col items-center gap-3 neu-card-inset`}>
              <div className={`font-mono text-xs tracking-widest break-all text-center ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                {inviteText}
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleCopy}
                className={`flex items-center justify-center gap-2 h-10 px-4 rounded-xl font-bold text-xs transition-colors ${
                  copied
                    ? 'bg-green-500 text-white'
                    : isDark
                      ? 'bg-white/10 hover:bg-white/20 text-[var(--text-primary)]'
                      : 'bg-white shadow hover:bg-gray-50 text-slate-800 border border-[var(--border-color)]'
                }`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? (t('onboarding.inviteCopied') || 'Copied!') : (t('header.copyLink') || 'Copy link')}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

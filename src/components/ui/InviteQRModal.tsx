import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check } from 'lucide-react';
import { QrCode } from '../QrCode';
import { modalOverlay, modalSurface, modalCloseClass, type ModalTheme } from './modalShared';

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

  const resolvedTheme: ModalTheme = isDark ? 'dark' : 'light';
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          data-theme={resolvedTheme}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={modalOverlay}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className={`${modalSurface(isDark, 'max-w-[340px]')} relative flex flex-col items-center`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className={`absolute top-4 right-4 z-10 ${modalCloseClass(isDark)}`}
            >
              <X size={18} />
            </button>

            <h3 className="text-xl font-bold mb-2 text-center text-foreground">
              {t('onboarding.invite') || 'Invite friends'}
            </h3>
            <p className="text-sm text-center mb-4 text-muted-foreground">
              {t('onboarding.inviteDescription') || 'Scan this QR code or copy the link to invite friends'}
            </p>

            <div className="w-[200px] h-[200px] flex items-center justify-center p-4 shadow-xl mb-4 rounded-xl bg-white">
              <QrCode data={inviteText} size={180} />
            </div>

            <div className="w-full p-4 rounded-md flex flex-col items-center gap-3 neu-card-inset">
              <div className="font-mono text-xs tracking-widest break-all text-center text-orange-500">
                {inviteText}
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleCopy}
                className={`flex items-center justify-center gap-2 h-10 px-4 rounded-xl font-bold text-xs transition-colors ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-background border border-border text-foreground hover:bg-muted'
                }`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? (t('onboarding.inviteCopied') || 'Copied!') : (t('header.copyLink') || 'Copy link')}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

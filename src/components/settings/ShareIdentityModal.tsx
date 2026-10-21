import React, { useEffect, useState } from 'react';
import { modalOverlay } from '../ui/modalShared';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { X, Copy, Check, Share2 } from 'lucide-react';
import QRCode from 'qrcode';
import { useAppStore } from '../../store';
import { PROFILE_FALLBACK_ID } from '../../constants/settingsConstants';

interface ShareIdentityModalProps {
  t: (key: string, fallback?: string) => string;
  onClose: () => void;
}

export const ShareIdentityModal = ({ t, onClose }: ShareIdentityModalProps) => {
  const [copied, setCopied] = useState(false);
  const userProfile = useAppStore((s) => s.userProfile);
  const shareId = userProfile?.id ? `nexus://id/${userProfile.id}` : PROFILE_FALLBACK_ID;
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(shareId, { margin: 1, width: 256, color: { dark: '#0f172a', light: '#ffffff' } })
      .then((url) => { if (!cancelled) setQrDataUrl(url); })
      .catch(() => { if (!cancelled) setQrDataUrl(''); });
    return () => { cancelled = true; };
  }, [shareId]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(shareId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const handleShare = async () => {
    // D5: кнопка Share без действия. Web Share API + fallback на копирование.
    const shareData = { title: t('settings.myIdentity', 'My identity'), text: shareId };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // пользователь отменил — молча
      }
    }
    handleCopyId();
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={modalOverlay}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className={`w-full max-w-[340px] p-6 shadow-2xl relative bg-[var(--bg-tertiary)] border border-[var(--border-color)]`}
      >
        <button
          type="button"
          className={`absolute top-4 right-4 z-10 min-w-11 min-h-11 rounded-full flex items-center justify-center cursor-pointer transition-colors bg-black/5 hover:bg-black/10 text-[var(--text-primary)] dark:bg-white/10 dark:hover:bg-white/20`}
          onClick={onClose}
          title={t('contacts.close', 'Close')}
          aria-label={t('contacts.close', 'Close')}
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center mt-4">
          <h3 className={`text-lg font-bold mb-2 text-[var(--text-primary)]`}>{t('settings.shareIdentity', 'Share Identity')}</h3>
          <p className={`text-xs text-center mb-6 px-4 text-[var(--text-tertiary)] dark:text-[var(--text-secondary)]`}>{t('settings.shareDescription', 'Share your identity so others can find and connect with you.')}</p>

          <div className={`w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] flex items-center justify-center p-4 shadow-xl mb-6 bg-white border-2 border-[var(--border-color)]`}>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt={t('settings.shareQrAlt', 'Your identity QR code')} className="w-full h-full object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-full border-2 border-[var(--text-tertiary)] border-t-transparent animate-spin" />
            )}
          </div>

          <div className={`w-full p-4 rounded-2xl flex flex-col items-center gap-3 bg-black/5 border border-[var(--border-color)] dark:bg-[var(--bg-secondary)]`}>
            <div className={`font-mono text-xs tracking-widest break-all text-center text-orange-600 dark:text-orange-400`}>
              {shareId}
            </div>
            <div className="flex gap-2 w-full">
              <button onClick={handleCopyId} aria-label={copied ? t('header.copied', 'Copied') : t('settings.copyId', 'Copy ID')} title={copied ? t('header.copied', 'Copied') : t('settings.copyId', 'Copy ID')} className={`flex-1 min-h-11 flex items-center justify-center gap-2 rounded-xl font-bold text-xs transition-colors ${copied ? "bg-green-500 text-[var(--ink-on-saturate)]" : "bg-black/5 hover:bg-black/10 text-[var(--text-primary)] dark:bg-white/10 dark:hover:bg-white/20"}`}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? t('header.copied', 'Copied') : t('settings.copyId', 'Copy ID')}</span>
              </button>
              <button onClick={handleShare} aria-label={t('settings.shareIdentity', 'Share Identity')} title={t('settings.shareIdentity', 'Share Identity')} className={`flex-1 min-h-11 shrink-0 flex items-center justify-center gap-2 rounded-xl font-bold text-xs transition-colors bg-black/5 hover:bg-black/10 text-[var(--text-primary)] dark:bg-white/10 dark:hover:bg-white/20`}>
                <Share2 size={14} />
                <span>{t('settings.shareIdentity', 'Share Identity')}</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};

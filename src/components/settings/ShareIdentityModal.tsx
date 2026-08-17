import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { X, Copy, Check, Share2 } from 'lucide-react';
import QRCode from 'qrcode';
import { useAppStore } from '../../store';
import { PROFILE_FALLBACK_ID } from '../../constants/settingsConstants';

interface ShareIdentityModalProps {
  isDark: boolean;
  t: (key: string, fallback?: string) => string;
  onClose: () => void;
}

export const ShareIdentityModal = ({ isDark, t, onClose }: ShareIdentityModalProps) => {
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
    });
  };

  return (
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
        className={`w-full max-w-[340px] p-6 shadow-2xl relative ${isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]" : "bg-white border border-[var(--border-color)]"}`}
      >
        <button
          type="button"
          className={`absolute top-4 right-4 z-10 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center cursor-pointer transition-colors ${isDark ? "bg-white/10 hover:bg-white/20 text-[var(--text-primary)]" : "bg-black/5 hover:bg-black/10 text-slate-800"}`}
          onClick={onClose}
          title={t('contacts.close', 'Close')}
          aria-label={t('contacts.close', 'Close')}
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center mt-4">
          <h3 className={`text-xl font-bold mb-2 ${isDark ? "text-[var(--text-primary)]" : "text-slate-800"}`}>{t('settings.shareIdentity', 'Share Identity')}</h3>
          <p className={`text-xs text-center mb-6 px-4 ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.shareDescription', 'Share your identity so others can find and connect with you.')}</p>

          <div className={`w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] flex items-center justify-center p-4 shadow-xl mb-6 ${isDark ? "bg-white" : "bg-white border-2 border-gray-100"}`}>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt={t('settings.shareQrAlt', 'Your identity QR code')} className="w-full h-full object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-full border-2 border-[var(--text-tertiary)] border-t-transparent animate-spin" />
            )}
          </div>

          <div className={`w-full p-4 rounded-2xl flex flex-col items-center gap-3 ${isDark ? "bg-[var(--bg-secondary)] border border-[var(--border-color)]" : "bg-slate-50 border border-[var(--border-color)]"}`}>
            <div className={`font-mono text-xs tracking-widest break-all text-center ${isDark ? "text-orange-400" : "text-orange-600"}`}>
              {shareId}
            </div>
            <div className="flex gap-2 w-full">
              <button onClick={handleCopyId} className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl font-bold text-xs transition-colors ${copied ? "bg-green-500 text-[var(--text-primary)]" : (isDark ? "bg-white/10 hover:bg-white/20 text-[var(--text-primary)]" : "bg-white shadow hover:bg-gray-50 text-slate-800")}`}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? t('header.copied', 'Copied') : t('settings.copyId', 'Copy ID')}
              </button>
              <button className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-xl transition-colors ${isDark ? "bg-white/10 hover:bg-white/20 text-[var(--text-primary)]" : "bg-white shadow hover:bg-gray-50 text-slate-800"}`}>
                <Share2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

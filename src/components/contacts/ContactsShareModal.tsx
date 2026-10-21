import { motion } from "motion/react";
import { QrCode, Check, Copy, Share } from "lucide-react";
import { FormModal } from "../ui/FormModal";

type T = (key: string, options?: any) => string;

interface ContactsShareModalProps {
  showShareId: boolean;
  theme: "light" | "dark";
  qrDataUrl: string;
  shareId: string;
  copied: boolean;
  t: T;
  onClose: () => void;
  onCopy: () => void;
}
export function ContactsShareModal({ showShareId, theme, qrDataUrl, shareId, copied, t, onClose, onCopy }: ContactsShareModalProps) {
  return (
    <FormModal isOpen={showShareId} onClose={onClose}
      title={t('contacts.shareIdentity')} subtitle={t('contacts.shareDescription')}
      icon={QrCode} theme={theme} closeTitle={t('contacts.close')}>
      <div className="flex flex-col items-center gap-4 mt-2">
        <div className={`w-[220px] h-[220px] flex items-center justify-center p-4 shadow-xl ${
          "bg-white border-2 border-[var(--border-color)]"
        }`}>
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={t('contacts.shareQrAlt', 'Your identity QR code')} className="w-full h-full object-contain" />
          ) : (
            <div className="w-10 h-10 rounded-full border-2 border-[var(--text-tertiary)] border-t-transparent animate-spin" />
          )}
        </div>
        <div className={`w-full p-4 rounded-2xl flex flex-col items-center gap-3 ${
          "bg-black/5 border border-[var(--border-color)] dark:bg-[var(--bg-secondary)]"
        }`}>
          <div className={`font-mono text-xs tracking-widest break-all text-center ${"text-[var(--accent)]"}`}>
            {shareId}
          </div>
          <div className="flex gap-2 w-full">
            <motion.button whileTap={{ scale: 0.95 }} onClick={onCopy}
              className={`flex-1 flex items-center justify-center gap-2 min-h-11 rounded-xl font-bold text-xs transition-colors ${
                copied ? "bg-green-500 text-[var(--ink-on-saturate)]" : "bg-white shadow hover:bg-black/5 text-[var(--text-primary)] dark:bg-white/10 dark:hover:bg-white/20 dark:shadow-none"
              }`}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? t('header.copied') : t('contacts.copyId', 'Copy ID')}
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }}
              aria-label={t('contacts.share', 'Share contact')}
              className={`w-10 h-10 min-w-11 min-h-11 shrink-0 flex items-center justify-center rounded-xl transition-colors ${
                "bg-white shadow hover:bg-black/5 text-[var(--text-primary)] dark:bg-white/10 dark:hover:bg-white/20 dark:shadow-none"
              }`}>
              <Share size={14} />
            </motion.button>
          </div>
        </div>
      </div>
    </FormModal>
  );
}

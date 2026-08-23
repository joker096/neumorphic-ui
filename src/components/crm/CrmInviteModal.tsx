import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Check } from 'lucide-react';
import { useAppStore } from '../../store';
import { useI18n } from '../../lib/i18n';
import { CRM_FALLBACKS } from '../../constants/crmConstants';
import { CrmModal } from './CrmModal';

const APP_HOME_URL = (import.meta.env.VITE_APP_URL as string | undefined) || 'https://mess.cvr.name';

export const CrmInviteModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useI18n();
  const ensureCrmInviteCode = useAppStore((s) => s.ensureCrmInviteCode);
  const [code, setCode] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCode(ensureCrmInviteCode());
  }, [ensureCrmInviteCode]);

  useEffect(() => {
    if (!code) return undefined;
    let cancelled = false;
    QRCode.toDataURL(`${APP_HOME_URL}/?invite=${code}`, {
      margin: 1, width: 256, color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((url) => { if (!cancelled) setQrUrl(url); })
      .catch(() => { if (!cancelled) setQrUrl(''); });
    return () => { cancelled = true; };
  }, [code]);

  const link = code ? `${APP_HOME_URL}/?invite=${code}` : '';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <CrmModal
      onClose={onClose}
      title={t('crm.inviteTitle', CRM_FALLBACKS.inviteTitle)}
      footer={(
        <button
          onClick={copy}
          className="w-full min-h-[44px] rounded-xl bg-[var(--accent)] text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? t('crm.copied', CRM_FALLBACKS.copied) : link}
        </button>
      )}
    >
      <div className="flex flex-col items-center gap-3 py-2">
        {qrUrl ? (
          <img
            src={qrUrl}
            alt={t('crm.inviteCode', CRM_FALLBACKS.inviteCode)}
            className="w-52 h-52 rounded-xl bg-white p-2"
          />
        ) : (
          <div className="w-52 h-52 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center text-xs text-[var(--text-secondary)]">
            {t('crm.inviteCode', CRM_FALLBACKS.inviteCode)}
          </div>
        )}
        <div className="text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
          {t('crm.inviteCode', CRM_FALLBACKS.inviteCode)}
        </div>
        <div className="font-mono text-lg font-bold tracking-widest text-[var(--text-primary)]">{code}</div>
        <div className="text-xs text-[var(--text-secondary)] text-center break-all">{link}</div>
        <div className="text-[10px] text-[var(--text-secondary)] text-center">
          {t('crm.inviteHint', CRM_FALLBACKS.inviteHint)}
        </div>
      </div>
    </CrmModal>
  );
};

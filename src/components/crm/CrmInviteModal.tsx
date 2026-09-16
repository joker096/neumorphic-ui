import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Check } from 'lucide-react';
import { useAppStore } from '../../store';
import * as idb from '../../lib/idb';
import { useI18n } from '../../lib/i18n';
import { CRM_FALLBACKS } from '../../constants/crmConstants';
import { CrmModal } from './CrmModal';
import { crmInviteLink } from '../../config/app';
import { useEscapeKey } from '../../hooks/useEscapeKey';

export const CrmInviteModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useI18n();
  const ensureCrmInviteCode = useAppStore((s) => s.ensureCrmInviteCode);
  const companyId = useAppStore((s) => s.companyId);
  const [code, setCode] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [copied, setCopied] = useState(false);
  useEscapeKey(onClose);

  useEffect(() => {
    setCode(ensureCrmInviteCode());
  }, [ensureCrmInviteCode]);

  useEffect(() => {
    if (!code) return undefined;
    let cancelled = false;
    QRCode.toDataURL(crmInviteLink(code), {
      margin: 1, width: 256, color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((url) => { if (!cancelled) setQrUrl(url); })
      .catch(() => { if (!cancelled) setQrUrl(''); });
    return () => { cancelled = true; };
  }, [code]);

  useEffect(() => {
    if (!code || !companyId) return;
    (async () => {
      const invites = ((await idb.get('company_invites')) as
        | Record<string, { companyId: string }>
        | null) || {};
      invites[code] = { companyId };
      await idb.set('company_invites', invites);
    })();
  }, [code, companyId]);

  const link = code ? crmInviteLink(code) : '';

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
        <div className="text-[11px] uppercase tracking-wide text-[var(--text-secondary)]">
          {t('crm.inviteCode', CRM_FALLBACKS.inviteCode)}
        </div>
        <div className="font-mono text-lg font-bold tracking-widest text-[var(--text-primary)]">{code}</div>
        <div className="text-xs text-[var(--text-secondary)] text-center break-all flex items-center gap-2 justify-center">
          <span>{link}</span>
          <button
            onClick={copy}
            aria-label={t('crm.copyLink', 'Copy invite link')}
            title={t('crm.copyLink', 'Copy invite link')}
            className="shrink-0 min-w-11 min-h-11 rounded-lg flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--accent)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
          </button>
        </div>
        <div className="text-[11px] text-[var(--text-secondary)] text-center">
          {t('crm.inviteHint', CRM_FALLBACKS.inviteHint)}
        </div>
      </div>
    </CrmModal>
  );
};

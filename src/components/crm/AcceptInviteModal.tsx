import React from 'react';
import { CrmModal } from './CrmModal';
import { useI18n } from '../../lib/i18n';

interface AcceptInviteModalProps {
  code: string;
  onAccept: () => void;
  onClose: () => void;
}

export const AcceptInviteModal: React.FC<AcceptInviteModalProps> = ({ code, onAccept, onClose }) => {
  const { t } = useI18n();
  return (
    <CrmModal
      onClose={onClose}
      title={t('crm.acceptInviteTitle', 'Incoming invite')}
      footer={
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[var(--text-secondary)] bg-[var(--bg-tertiary)] font-medium min-h-11 active:scale-95 transition-transform"
          >
            {t('common.cancel', 'Cancel')}
          </button>
          <button
            onClick={onAccept}
            className="px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--button-primary-text)] font-medium min-h-11 active:scale-95 transition-transform"
          >
            {t('common.accept', 'Accept')}
          </button>
        </div>
      }
    >
      <p className="text-sm text-[var(--text-secondary)]">{t('crm.acceptInviteBody', 'You have been invited. Accept the invite to join.')}</p>
      <div className="mt-3 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] font-mono text-sm text-[var(--text-primary)] break-all">
        {code}
      </div>
    </CrmModal>
  );
};

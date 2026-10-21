import { motion } from 'motion/react';
import { modalOverlay } from '../ui/modalShared';
import { QrCode } from '../QrCode';
import { COMPANY_MODAL_MAX_WIDTH } from '../../constants/companyConstants';
import { CompanyModalCloseButton } from './CompanyModalCloseButton';
import type { InviteQRPayload } from '../../lib/company/types';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { FORM_CARD_CLASS } from '../ui/formClasses';
type CompanyInviteModalProps = {
  isDark: boolean;
  title: string;
  description: string;
  invitePayload: InviteQRPayload | null;
  companyId: string | null;
  onClose: () => void;
};

export const CompanyInviteModal = ({ isDark, title, description, invitePayload, companyId, onClose }: CompanyInviteModalProps) => {
  useEscapeKey(onClose);
  return (
    <motion.div
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
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${COMPANY_MODAL_MAX_WIDTH} p-6 shadow-2xl relative flex flex-col items-center rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]`}
      >
        <CompanyModalCloseButton onClick={onClose} />
        <h3 className="text-xl font-bold mb-4 text-[var(--text-primary)]">{title}</h3>
        <p className="text-sm text-center mb-4 text-[var(--text-secondary)]">{description}</p>
        <div className={"w-full max-w-[200px] aspect-square flex items-center justify-center p-4 shadow-xl mb-4 bg-white border-2 border-[var(--border-color)]"}>
          <QrCode data={invitePayload ? JSON.stringify(invitePayload) : (companyId || '')} size={180} />
        </div>
        <div className={FORM_CARD_CLASS}>
          <div className="font-mono text-xs tracking-widest break-all text-center text-[var(--accent)]">
            {invitePayload?.org || companyId || ''}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

import { motion } from 'motion/react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { COMPANY_MODAL_MAX_WIDTH } from '../../constants/companyConstants';
import { CompanyModalCloseButton } from './CompanyModalCloseButton';

type CompanyScanQrModalProps = {
  isDark: boolean;
  title: string;
  description: string;
  onClose: () => void;
  onScanResult: (value: string) => void;
};

export const CompanyScanQrModal = ({ isDark, title, description, onClose, onScanResult }: CompanyScanQrModalProps) => (
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
      onClick={(e) => e.stopPropagation()}
      className={`w-full ${COMPANY_MODAL_MAX_WIDTH} p-6 shadow-2xl relative rounded-2xl ${isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]" : "bg-white border border-[var(--border-color)]"}`}
    >
      <CompanyModalCloseButton onClick={onClose} />
      <h3 className="text-xl font-bold mb-6 text-[var(--text-primary)]">{title}</h3>
      <div className="w-full aspect-square overflow-hidden relative shadow-inner bg-gray-100">
        <Scanner
          onScan={(result) => {
            if (result && result.length > 0) {
              onScanResult(result[0].rawValue);
            }
          }}
          styles={{ container: { width: '100%', height: '100%' } }}
        />
        <div className="absolute inset-0 border-4 border-[var(--accent)]/50 pointer-events-none mix-blend-overlay" />
      </div>
      <p className="text-xs text-center mt-6 text-[var(--text-secondary)]">{description}</p>
    </motion.div>
  </motion.div>
);

import { motion } from 'motion/react';
import { CompanyProfileEditor } from './CompanyProfileEditor';

type CompanySettingsModalProps = {
  onClose: () => void;
};

export const CompanySettingsModal = ({ onClose }: CompanySettingsModalProps) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
    onClick={onClose}
  >
    <div className="absolute inset-0 z-[100]" onClick={(e) => e.stopPropagation()}>
      <CompanyProfileEditor onClose={onClose} />
    </div>
  </motion.div>
);

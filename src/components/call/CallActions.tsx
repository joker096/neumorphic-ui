import { motion } from "motion/react";
import { Phone, UserPlus } from "lucide-react";

interface CallActionsProps {
  number: string;
  isCalling: boolean;
  isDark: boolean;
  t: (key: string) => string;
  onAddContact: () => void;
  onCallToggle: () => void;
  onDelete: () => void;
}

export const CallActions = ({ number, isCalling, isDark, t, onAddContact, onCallToggle, onDelete }: CallActionsProps) => (
  <div className={`flex items-center justify-center gap-6 w-[240px] mt-3 relative z-10 sticky bottom-0 pb-2 pt-2 mx-auto ${
    isDark ? 'bg-[var(--bg-tertiary)]' : 'bg-[var(--bg-secondary)]'
  }`}>
    <motion.button
      type="button"
      whileTap={{ scale: 0.9 }}
      onClick={onAddContact}
      className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 ${
        number.length > 0
          ? (isDark ? "opacity-60 hover:opacity-100 text-gray-400 hover:text-[var(--text-primary)]" : "opacity-60 hover:opacity-100 text-slate-500 hover:text-slate-700")
          : "opacity-0 pointer-events-none"
      } ${isCalling ? "pointer-events-none opacity-0" : ""}`}
      title={t('contacts.addContact')}
      aria-label={t('contacts.addContact')}
    >
      <UserPlus size={20} />
    </motion.button>

    <motion.button
      type="button"
      onClick={onCallToggle}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.9 }}
      title={isCalling ? t('chat.endCall') : t('chat.startCall')}
      aria-label={isCalling ? t('chat.endCall') : t('chat.startCall')}
      className={`w-[76px] h-[76px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 shadow-xl ${
        isCalling
          ? "bg-gradient-to-br from-red-500 to-red-700 shadow-[0_12px_24px_rgba(239,68,68,0.3)]"
          : isDark
            ? "bg-gradient-to-br from-orange-400 to-orange-600 shadow-[0_12px_24px_rgba(249,115,22,0.3)]"
            : "bg-gradient-to-br from-orange-400 to-orange-500 shadow-[0_12px_24px_rgba(249,115,22,0.3)]"
      }`}
    >
      <Phone className={`text-[var(--text-primary)] drop-shadow-sm fill-white/20 transition-transform ${
        isCalling ? "rotate-[135deg]" : ""
      }`} size={28} strokeWidth={2} />
    </motion.button>

    <motion.button
      type="button"
      whileTap={{ scale: 0.9 }}
      onClick={onDelete}
      className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 opacity-60 hover:opacity-100 ${
        isDark ? "text-gray-400 hover:text-[var(--text-primary)]" : "text-slate-500 hover:text-slate-700"
      } ${isCalling ? "pointer-events-none opacity-0" : ""}`}
      title={t('common.delete')}
      aria-label={t('common.delete')}
    >
      {number.length > 0 && !isCalling ? (
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
          <path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12 19 15.59z" />
        </svg>
      ) : null}
    </motion.button>
  </div>
);





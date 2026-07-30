import { AnimatePresence, motion } from "motion/react";
import { Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing, UserPlus } from "lucide-react";

interface CallEntry {
  id: string | number;
  name: string;
  time: string;
  duration?: string;
  type: "incoming" | "outgoing" | "missed";
}

interface CallHistoryListProps {
  calls: CallEntry[];
  isDark: boolean;
  t: (key: string) => string;
  onCallClick: (call: CallEntry) => void;
  onQuickAddContact: (name: string) => void;
}

export const CallHistoryList = ({ calls, isDark, t, onCallClick, onQuickAddContact }: CallHistoryListProps) => {
  const unknownCaller = t('call.unknownCaller');

  if (calls.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center h-full py-8 ${isDark ? "text-gray-500" : "text-slate-400"}`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${isDark ? "bg-white/5" : "bg-black/5"}`}>
          <Phone className="w-5 h-5 opacity-40" />
        </div>
        <p className="text-sm">{t('chat.noCalls')}</p>
      </div>
    );
  }

  return (
    <AnimatePresence mode="popLayout">
      {calls.map((call) => (
        <motion.div
          key={call.id}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          onClick={() => onCallClick(call)}
          className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all group ${
            isDark ? "hover:bg-white/5 text-gray-300" : "hover:bg-black/5 text-slate-700"
          }`}
        >
          <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 ${
            call.type === "missed"
              ? isDark ? "bg-red-500/10 text-red-400" : "bg-red-500/10 text-red-600"
              : isDark ? "bg-white/5 text-gray-400" : "bg-black/5 text-slate-500"
          }`}>
            {call.type === "incoming" && <PhoneIncoming size={16} />}
            {call.type === "outgoing" && <PhoneOutgoing size={16} />}
            {call.type === "missed" && <PhoneMissed size={16} />}
          </div>
          <div className="flex-1 flex flex-col min-w-0 pr-2">
            <span className={`text-[14px] font-bold truncate leading-snug ${
              call.type === "missed"
                ? (isDark ? "text-red-400" : "text-red-600")
                : isDark ? "text-[var(--text-primary)]" : "text-slate-800"
            }`}>
              {call.name}
            </span>
            <div className="flex gap-2 items-center mt-0.5">
              <span className={`text-[11px] font-semibold tracking-wide ${isDark ? "text-orange-400" : "text-orange-600"}`}>
                {call.time}
              </span>
              {call.duration && (
                <span className={`text-[10px] font-medium ${isDark ? "text-gray-500" : "text-slate-400"}`}>
                  • {call.duration}
                </span>
              )}
            </div>
          </div>
          {(call.name.startsWith("+") || call.name === unknownCaller) && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); onQuickAddContact(call.name); }}
              className={`min-w-[44px] min-h-[44px] rounded-full shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all ${
                isDark ? "bg-white/10 hover:bg-white/20 text-[var(--text-primary)]" : "bg-black/5 hover:bg-black/10 text-slate-700"
              }`}
              title={t('contacts.addContact')}
            >
              <UserPlus size={14} />
            </motion.button>
          )}
        </motion.div>
      ))}
    </AnimatePresence>
  );
};


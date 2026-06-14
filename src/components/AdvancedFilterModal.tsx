import { Sheet } from './ui/Sheet';
import { X, ListFilter, Mic, MessageCircle, Bot, Hash } from "lucide-react";

interface AdvancedFilterModalProps {
  isDark: boolean;
  show: boolean;
  onClose: () => void;
  filters: { hasMedia: boolean; hasAudio: boolean; hasReplies: boolean; fromBots: boolean; priority: boolean };
  onToggle: (key: string) => void;
  onReset: () => void;
  t: (key: string) => string;
}

const FILTER_ITEMS = [
  { id: 'hasMedia', icon: ListFilter },
  { id: 'hasAudio', icon: Mic },
  { id: 'hasReplies', icon: MessageCircle },
  { id: 'fromBots', icon: Bot },
  { id: 'priority', icon: Hash },
];

export const AdvancedFilterModal = ({ isDark, show, onClose, filters, onToggle, onReset, t }: AdvancedFilterModalProps) => {
  return (
    <Sheet isOpen={show} onClose={onClose} detent="large">
            <div className="flex items-center justify-between mb-6">
              <h3 className={`font-bold font-sans text-lg ${isDark ? "text-white" : "text-black"}`}>{t('chat.advancedFilters')}</h3>
              <div onClick={onClose} className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${isDark ? "bg-[#1a1d24] text-gray-400 hover:text-white" : "bg-black/5 text-slate-500 hover:text-slate-800"}`}>
                <X size={16} />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {FILTER_ITEMS.map(f => (
                <label key={f.id} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${filters[f.id as keyof typeof filters] ? "bg-orange-500 text-white" : (isDark ? "bg-[#1a1d24] text-gray-400 group-hover:text-gray-200" : "bg-slate-50 text-slate-500 group-hover:text-slate-700")}`}>
                    <f.icon size={18} />
                  </div>
                  <span className={`text-sm font-bold flex-1 ${isDark ? "text-gray-300" : "text-slate-700"}`}>{t(`chat.filter${f.id.charAt(0).toUpperCase() + f.id.slice(1)}`)}</span>
                  <div className={`w-[44px] h-[24px] rounded-full p-1 transition-colors flex items-center ${filters[f.id as keyof typeof filters] ? "bg-orange-500" : (isDark ? "bg-[#1a1d24]" : "bg-slate-100")}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${filters[f.id as keyof typeof filters] ? "translate-x-[20px]" : "translate-x-0"}`} />
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={filters[f.id as keyof typeof filters]}
                    onChange={() => onToggle(f.id)}
                  />
                </label>
              ))}
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={onReset}
                className={`flex-1 py-3 text-xs font-bold rounded-2xl transition-colors ${isDark ? "bg-[#1a1d24] text-gray-400 hover:bg-white/5" : "bg-slate-50 text-slate-500 hover:bg-black/5"}`}
              >
                {t('chat.filterReset')}
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 text-xs font-bold rounded-2xl bg-orange-500 text-white transition-opacity hover:opacity-90 shadow-md"
              >
                {t('chat.filterApply')}
              </button>
            </div>
    </Sheet>
  );
};

import { Phone, Video } from 'lucide-react';
import { motion } from 'motion/react';
import type { CompanyMember } from '../../lib/company/types';

type MemberItemProps = {
  member: CompanyMember;
  isDark: boolean;
  index: number;
  color: string;
  onCall?: (name: string, color?: string) => void;
  onVideoCall?: (name: string, color?: string) => void;
  onClick?: () => void;
  t: (key: string, args?: Record<string, string | number>) => string;
};

export const MemberItem = ({ member, isDark, index, color, onCall, onVideoCall, onClick, t }: MemberItemProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3 md:p-3 rounded-2xl cursor-pointer transition-all active:scale-95 min-h-[56px] ${isDark ? "hover:bg-[#1a1d24]" : "hover:bg-white shadow-sm"}`}
  >
    <div className="relative shrink-0">
      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-sm`}>
        {member.displayName.charAt(0)}
      </div>
      {member.online && (
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${isDark ? "bg-green-400 border-[#1a1d24]" : "bg-emerald-500 border-white"}`} />
      )}
    </div>
    <div className="flex-1 min-w-0">
      <div className={`font-bold truncate text-sm ${isDark ? "text-gray-100" : "text-slate-800"}`}>{member.displayName}</div>
      <div className={`text-[10px] truncate ${isDark ? "text-gray-400" : "text-slate-500"}`}>
        {member.role === 'admin' ? t('company.roleAdmin') : t('company.roleMember')} • {member.office && (member.office === 'moscow' ? t('company.officeMoscow') : t('company.officeLondon'))}
      </div>
    </div>
    <div className="flex gap-1 shrink-0">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onCall?.(member.displayName, color);
        }}
        className={`p-1.5 min-w-[36px] min-h-[36px] rounded-lg ${isDark ? "bg-white/5 hover:bg-white/10 text-gray-300" : "bg-black/5 hover:bg-black/10 text-slate-600"}`}
      >
        <Phone size={14} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onVideoCall?.(member.displayName, color);
        }}
        className={`p-1.5 min-w-[36px] min-h-[36px] rounded-lg ${isDark ? "bg-white/5 hover:bg-white/10 text-gray-300" : "bg-black/5 hover:bg-black/10 text-slate-600"}`}
      >
        <Video size={14} />
      </button>
    </div>
  </motion.div>
);

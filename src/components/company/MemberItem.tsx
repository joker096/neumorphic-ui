import { Phone, Video } from 'lucide-react';
import { motion } from 'motion/react';
import type { CompanyMember } from '../../lib/company/types';

type MemberItemProps = {
  member: CompanyMember;
  isDark?: boolean;
  index: number;
  color: string;
  onCall?: (name: string, color?: string) => void;
  onVideoCall?: (name: string, color?: string) => void;
  onClick?: () => void;
  t: (key: string, args?: Record<string, string | number>) => string;
};

const iconBtn = (icon: React.ReactNode, isDark: boolean, onClick: () => void) => (
  <button
    onClick={onClick}
    className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all shrink-0 ${
      isDark ? "bg-[var(--bg-tertiary)] hover:bg-[var(--list-item-hover-bg)] text-[var(--text-secondary)]" : "bg-[var(--bg-secondary)] hover:bg-[var(--list-item-hover-bg)] text-[var(--text-secondary)]"
    }`}
  >
    {icon}
  </button>
);

export const MemberItem = ({ member, isDark = false, index, color, onCall, onVideoCall, onClick, t }: MemberItemProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3 md:p-3 rounded-2xl cursor-pointer transition-all active:scale-95 min-h-[56px] ${isDark ? "hover:bg-[var(--list-item-hover-bg)]" : "hover:bg-[var(--list-item-hover-bg)]"}`}
  >
    <div className="relative shrink-0">
      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-[var(--text-primary)] font-bold text-sm`}>
        {member.displayName.charAt(0)}
      </div>
      {member.online && (
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${isDark ? "bg-[var(--color-success)] border-[var(--bg-tertiary)]" : "bg-[var(--color-success)] border-[var(--border-color)]"}`} />
      )}
    </div>
    <div className="flex-1 min-w-0">
      <div className={`font-bold truncate text-sm ${isDark ? "text-[var(--text-primary)]" : "text-[var(--text-primary)]"}`}>{member.displayName}</div>
      <div className={`text-[10px] truncate ${isDark ? "text-[var(--text-secondary)]" : "text-[var(--text-secondary)]"}`}>
        {member.role === 'admin' ? t('company.roleAdmin') : t('company.roleMember')} • {member.office && (member.office === 'moscow' ? t('company.officeMoscow') : t('company.officeLondon'))}
      </div>
    </div>
    <div className="flex gap-2 shrink-0">
      {onCall && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCall?.(member.displayName, color);
          }}
          className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all shrink-0 ${isDark ? "bg-[var(--bg-tertiary)] hover:bg-[var(--list-item-hover-bg)] text-[var(--text-secondary)]" : "bg-[var(--bg-secondary)] hover:bg-[var(--list-item-hover-bg)] text-[var(--text-secondary)]"}`}
        >
          <Phone size={14} />
        </button>
      )}
      {onVideoCall && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onVideoCall?.(member.displayName, color);
          }}
          className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all shrink-0 ${isDark ? "bg-[var(--bg-tertiary)] hover:bg-[var(--list-item-hover-bg)] text-[var(--text-secondary)]" : "bg-[var(--bg-secondary)] hover:bg-[var(--list-item-hover-bg)] text-[var(--text-secondary)]"}`}
        >
          <Video size={14} />
        </button>
      )}
    </div>
  </motion.div>
);




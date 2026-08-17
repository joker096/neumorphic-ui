import { Phone, Video } from 'lucide-react';
import { motion } from 'motion/react';
import type { CompanyMember } from '../../lib/company/types';
import { COMPANY_MEMBER_FALLBACKS } from '../../constants/companyConstants';

type MemberItemProps = {
  member: CompanyMember;
  isDark?: boolean;
  index: number;
  color: string;
  onCall?: (name: string, color?: string) => void;
  onVideoCall?: (name: string, color?: string) => void;
  onClick?: () => void;
  t: (key: string, args?: Record<string, string | number> | string) => string;
};

const actionBtn = (icon: React.ReactNode, label: string, onClick: (e: React.MouseEvent) => void, isDark?: boolean) => (
  <button
    aria-label={label}
    onClick={onClick}
    className={`w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all shrink-0 min-w-[44px] min-h-[44px] ${
      isDark ? "bg-[var(--bg-tertiary)] hover:bg-[var(--list-item-hover-bg)] text-[var(--text-secondary)]" : "bg-[var(--bg-secondary)] hover:bg-[var(--list-item-hover-bg)] text-[var(--text-secondary)]"
    }`}
  >
    {icon}
  </button>
);

export const MemberItem = ({ member, isDark = false, index, color, onCall, onVideoCall, onClick, t }: MemberItemProps) => {
  const roleLabel =
    member.role === 'admin'
      ? t('company.roleAdmin', COMPANY_MEMBER_FALLBACKS.roleAdmin)
      : t('company.roleMember', COMPANY_MEMBER_FALLBACKS.roleMember);
  const officeLabel = member.office
    ? member.office === 'moscow'
      ? t('company.officeMoscow', COMPANY_MEMBER_FALLBACKS.officeMoscow)
      : member.office === 'london'
        ? t('company.officeLondon', COMPANY_MEMBER_FALLBACKS.officeLondon)
        : null
    : null;
  const subtitle = officeLabel ? `${roleLabel} • ${officeLabel}` : roleLabel;

  return (
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
        <div className="font-bold truncate text-sm text-[var(--text-primary)]">{member.displayName}</div>
        <div className="text-[10px] truncate text-[var(--text-secondary)]">
          {subtitle}
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        {onCall && (
          actionBtn(
            <Phone size={16} />,
            t('company.call', COMPANY_MEMBER_FALLBACKS.call),
            (e) => {
              e.stopPropagation();
              onCall(member.displayName, color);
            },
            isDark,
          )
        )}
        {onVideoCall && (
          actionBtn(
            <Video size={16} />,
            t('company.videoCall', COMPANY_MEMBER_FALLBACKS.videoCall),
            (e) => {
              e.stopPropagation();
              onVideoCall(member.displayName, color);
            },
            isDark,
          )
        )}
      </div>
    </motion.div>
  );
};




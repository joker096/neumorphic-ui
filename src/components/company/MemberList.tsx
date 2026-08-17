import { Users, Loader2, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { MemberItem } from './MemberItem';
import type { CompanyMember } from '../../lib/company/types';
import { memberColorAt, COMPANY_UI_FALLBACKS } from '../../constants/companyConstants';

type MemberListProps = {
  isDark?: boolean;
  members: CompanyMember[];
  onCall?: (name: string, color?: string) => void;
  onVideoCall?: (name: string, color?: string) => void;
  onMemberClick?: (member: CompanyMember, color: string) => void;
  teamMembersLabel: string;
  t: (key: string, args?: Record<string, string | number> | string) => string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
};

export const MemberList = ({
  isDark = false,
  members,
  onCall,
  onVideoCall,
  onMemberClick,
  teamMembersLabel,
  t,
  loading = false,
  error = null,
  onRetry,
}: MemberListProps) => {
  return (
    <div className="w-full mb-4">
      <div className="flex items-center gap-2 px-2 mb-3 font-bold text-xs uppercase tracking-widest text-[var(--accent)]">
        <Users size={14} />
        <span className="truncate">{teamMembersLabel} ({members.length})</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-[var(--text-secondary)]">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-xs">{t('company.loading', 'Loading...')}</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
          <AlertCircle size={20} className="text-[var(--color-warning)]" />
          <span className="text-xs text-[var(--text-secondary)]">{error}</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="min-h-[44px] px-4 rounded-xl text-xs font-bold cursor-pointer transition-all bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:brightness-110"
            >
              {t('company.retry', COMPANY_UI_FALLBACKS.retry)}
            </button>
          )}
        </div>
      ) : members.length === 0 ? (
        <div className="py-8 text-center text-xs text-[var(--text-secondary)]">
          {t('company.emptyMembers', COMPANY_UI_FALLBACKS.emptyMembers)}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <AnimatePresence>
            {members.map((member, i) => (
              <MemberItem
                key={member.userId}
                member={member}
                isDark={isDark}
                index={i}
                color={memberColorAt(i)}
                onCall={onCall}
                onVideoCall={onVideoCall}
                onClick={() => onMemberClick?.(member, memberColorAt(i))}
                t={t}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};


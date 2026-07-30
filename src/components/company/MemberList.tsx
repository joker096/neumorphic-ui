import { Users } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { MemberItem } from './MemberItem';
import type { CompanyMember } from '../../lib/company/types';

type MemberListProps = {
  isDark?: boolean;
  members: CompanyMember[];
  onCall?: (name: string, color?: string) => void;
  onVideoCall?: (name: string, color?: string) => void;
  onMemberClick?: (member: CompanyMember, color: string) => void;
  teamMembersLabel: string;
  t: (key: string, args?: Record<string, string | number>) => string;
};

export const MemberList = ({ isDark = false, members, onCall, onVideoCall, onMemberClick, teamMembersLabel, t }: MemberListProps) => {
  const colors = ["from-indigo-400 to-purple-500", "from-pink-400 to-rose-500", "from-yellow-400 to-orange-500", "from-teal-400 to-cyan-500"];
  
  return (
    <div className="w-full mb-4">
      <div className={`flex items-center gap-2 px-2 mb-3 font-bold text-xs uppercase tracking-widest text-[var(--accent)]`}>
        <Users size={14} />
        <span className="truncate">{teamMembersLabel} ({members.length})</span>
      </div>
      
      <div className="flex flex-col gap-2">
        <AnimatePresence>
          {members.map((member, i) => (
            <MemberItem
              key={member.userId}
              member={member}
              isDark={isDark}
              index={i}
              color={colors[i % colors.length]}
              onCall={onCall}
              onVideoCall={onVideoCall}
              onClick={() => onMemberClick?.(member, colors[i % colors.length])}
              t={t}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};


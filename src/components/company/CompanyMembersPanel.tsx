import { Users, Video } from 'lucide-react';
import { MemberList } from './MemberList';
import { ChannelList } from './ChannelList';
import { CHANNEL_CLICK_GRADIENT } from '../../constants/companyConstants';
import type { CompanyMember, CompanyChannel } from '../../lib/company/types';
import type { TFunction } from './useCompanyContacts';

type CompanyMembersPanelProps = {
  isDark: boolean;
  members: CompanyMember[];
  channels: CompanyChannel[];
  canManage: boolean;
  currentUserId: string;
  groupMode: boolean;
  selectedIds: Set<string>;
  t: TFunction;
  onCall?: (name: string, color?: string) => void;
  onVideoCall?: (name: string, color?: string) => void;
  onMessage?: (name: string, color?: string) => void;
  onToggleSelect: (userId: string) => void;
  onMemberEdit: (member: CompanyMember) => void;
  onEnterGroupMode: () => void;
  onExitGroupMode: () => void;
  onStartGroupCall: () => void;
};

export const CompanyMembersPanel = ({
  isDark,
  members,
  channels,
  canManage,
  currentUserId,
  groupMode,
  selectedIds,
  t,
  onCall,
  onVideoCall,
  onMessage,
  onToggleSelect,
  onMemberEdit,
  onEnterGroupMode,
  onExitGroupMode,
  onStartGroupCall,
}: CompanyMembersPanelProps) => (
  <>
    <div className="flex items-center justify-end mb-2">
      {!groupMode ? (
        <button
          onClick={onEnterGroupMode}
          disabled={members.length < 2}
          className="min-h-[40px] px-3 rounded-xl flex items-center gap-2 text-xs font-bold cursor-pointer transition-all bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:brightness-110 disabled:opacity-40"
        >
          <Users size={15} />
          {t('company.startGroupCall', 'Group video call')}
        </button>
      ) : (
        <button
          onClick={onExitGroupMode}
          className="min-h-[40px] px-3 rounded-xl flex items-center gap-2 text-xs font-bold cursor-pointer transition-all bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:brightness-110"
        >
          {t('company.cancel', 'Cancel')}
        </button>
      )}
    </div>
    <MemberList
      isDark={isDark}
      members={members}
      canManage={canManage}
      currentUserId={currentUserId}
      onCall={onCall}
      onVideoCall={onVideoCall}
      onMemberClick={(member, color) => onMessage?.(member.displayName, color)}
      onMemberEdit={onMemberEdit}
      selectable={groupMode}
      selectedIds={selectedIds}
      onToggleSelect={onToggleSelect}
      teamMembersLabel={t('company.teamMembers') || 'Team Members'}
      t={t}
    />
    <ChannelList
      isDark={isDark}
      channels={channels}
      channelsLabel={t('company.channels') || 'Company Channels'}
      t={t}
      onChannelClick={(channel) => onMessage?.(channel.name, CHANNEL_CLICK_GRADIENT)}
    />
    {groupMode && (
      <div className="sticky bottom-0 mt-3 p-3 rounded-2xl bg-[var(--bg-secondary)]/95 backdrop-blur border border-[var(--border-color)] flex items-center gap-3">
        <span className="flex-1 text-xs text-[var(--text-secondary)]">
          {t('company.selectedCount', 'Selected')}: {selectedIds.size}
        </span>
        <button
          onClick={onStartGroupCall}
          disabled={selectedIds.size === 0}
          className="min-h-[44px] px-5 rounded-xl flex items-center gap-2 font-bold text-sm cursor-pointer transition-all bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:brightness-110 disabled:opacity-50"
        >
          <Video size={16} />
          {t('company.startCall', 'Start call')}
        </button>
      </div>
    )}
  </>
);

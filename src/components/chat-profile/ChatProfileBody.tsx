import React, { useState } from 'react';
import {
  MessageCircle, Users, Image as ImageIcon, FileText, Link as LinkIcon, Mic,
  Shield, Crown, X, Pin, AtSign, Info, Bell, BellOff,
} from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { previewOf } from '../chat-preview/PinnedMessagesBar';
import { CrmCard } from '../crm/CrmCard';
import { DataState } from '../ui/DataState';
import { ToggleSwitch } from '../ui/SettingsRow';
import { GroupManagementPanel } from '../chat/GroupManagementPanel';
import { SharedMediaTabs } from '../chat/SharedMediaTabs';
import {
  CHAT_PROFILE_MEDIA_GRADIENTS,
  CHAT_PROFILE_MOCK_MEMBERS,
  CHAT_PROFILE_DEFAULT_SUBSCRIBERS,
} from '../../constants/chatConstants';
import { formatLongDate } from '../../utils/dateTime';
import type { GroupMember, GroupPermissions } from '../../store/slices/chatSlice';
import { ROW_SHELL_CLASS } from '../ui/rowClasses';
import { MEDIUM_LABEL_CLASS } from '../ui/textClasses';
import { LARGE_LABEL_CLASS } from '../ui/textClasses';

export type ChatProfileKind = 'user' | 'group' | 'channel' | 'bot';

export type ProfileChat = {
  id: any; name: string; color: string; type?: ChatProfileKind; online?: boolean;
  members?: number | GroupMember[]; subscribers?: number; subscriberCount?: number;
  group?: any; bio?: string; username?: string; verified?: boolean; isChannel?: boolean;
  isPublic?: boolean; isPrivate?: boolean; description?: string; postCount?: number;
  history?: any[]; ownerId?: string;
};

const TABS = [
  { id: 'media', label: 'profile.tab.media', fallback: 'Media', icon: <ImageIcon size={14} /> },
  { id: 'files', label: 'profile.tab.files', fallback: 'Files', icon: <FileText size={14} /> },
  { id: 'links', label: 'profile.tab.links', fallback: 'Links', icon: <LinkIcon size={14} /> },
  { id: 'voice', label: 'profile.tab.voice', fallback: 'Voice', icon: <Mic size={14} /> },
];

/** Card surface shared by every block of the profile body (both themes). */
const CARD = 'rounded-xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-tertiary)]';

/** Icon badge used inside rows/placeholders (translucent panel token for both themes). */
const ICON_BOX = 'bg-[var(--msg-bg-panel)]';

interface ChatProfileBodyProps {
  chat: ProfileChat;
  kind: ChatProfileKind;
  isDark: boolean;
  ownerName?: string;
  groupCreatedAt?: number;
  groupDescription: string;
  crmMatch?: any;
  crmDeals: any[];
  crmTasks: any[];
  groupMessages: any[];
  groupPinned: any[];
  groupPerms: GroupPermissions;
  canManageGroup: boolean;
  isChatMuted: boolean;
  onToggleMute: () => void;
  removePinnedMessage: (id: any, chatId: any) => void;
  toggleGroupPermission: (key: keyof GroupPermissions) => void;
  onMessage?: () => void;
  onCall?: () => void;
  onVideoCall?: () => void;
  onClose: () => void;
}

/** Scrollable body of the chat profile: stats, group info, media, members, pins, permissions. */
export const ChatProfileBody = ({
  chat, kind, isDark, ownerName, groupCreatedAt, groupDescription, crmMatch, crmDeals, crmTasks,
  groupMessages, groupPinned, groupPerms, canManageGroup, isChatMuted, onToggleMute,
  removePinnedMessage, toggleGroupPermission, onMessage, onCall, onVideoCall, onClose,
}: ChatProfileBodyProps) => {
  const { t, lang } = useI18n();
  const [activeTab, setActiveTab] = useState('media');

  return (
    <>
{/* Channel statistics */}
{kind === 'channel' && (
  <div className="px-4 mt-5">
    <SectionTitle icon={<Info size={16} />} title={t('profile.statistics', 'Statistics')} />
    <div className="grid grid-cols-3 gap-2">
      <div className="rounded-xl p-3 text-center border border-[var(--border-color)] bg-[var(--bg-tertiary)]">
        <div className={LARGE_LABEL_CLASS}>{chat.subscriberCount ?? chat.subscribers ?? CHAT_PROFILE_DEFAULT_SUBSCRIBERS}</div>
        <div className="text-xs mt-0.5 text-[var(--text-secondary)]">{t('profile.subscribersLabel', 'Subscribers')}</div>
      </div>
      <div className="rounded-xl p-3 text-center border border-[var(--border-color)] bg-[var(--bg-tertiary)]">
        <div className={LARGE_LABEL_CLASS}>{chat.postCount ?? chat.history?.length ?? 0}</div>
        <div className="text-xs mt-0.5 text-[var(--text-secondary)]">{t('profile.postsLabel', 'Posts')}</div>
      </div>
      <div className="rounded-xl p-3 text-center border border-[var(--border-color)] bg-[var(--bg-tertiary)]">
        <div className="text-sm font-bold truncate px-1 text-[var(--text-primary)]">{chat.ownerId ? (ownerName || t('profile.owner', 'Owner')) : '—'}</div>
        <div className="text-xs mt-0.5 text-[var(--text-secondary)]">{t('profile.owner', 'Owner')}</div>
      </div>
    </div>
  </div>
)}

{/* Group info */}
{kind === 'group' && (
  <div className="px-4 mt-5">
    <SectionTitle icon={<Info size={16} />} title={t('profile.groupInfo', 'Group info')} />
    <div className={CARD}>
      <InfoRow label={t('profile.owner', 'Owner')} value={ownerName ?? '—'} />
      {groupCreatedAt ? <InfoRow label={t('profile.created', 'Created')} value={formatLongDate(groupCreatedAt, lang)} /> : null}
      <InfoRow label={t('profile.description', 'Description')} value={groupDescription || t('profile.noDescription', 'No description')} />
    </div>
  </div>
)}

{/* Quick toggles */}
<div className="px-4 mt-4 space-y-2">
  <Row icon={isChatMuted ? <BellOff size={16} /> : <Bell size={16} />} title={t('profile.mute', 'Mute')} right={<ToggleSwitch isOn={isChatMuted} onToggle={onToggleMute} ariaLabel={t('profile.mute', 'Mute')} isDark={isDark} />} />
</div>

{/* In-chat CRM card */}
{crmMatch && (
  <div className="px-4 mt-4">
    <CrmCard
      contact={crmMatch}
      deals={crmDeals}
      tasks={crmTasks}
      onCall={onCall}
      onVideoCall={onVideoCall}
      onMessage={onMessage}
      isDark={isDark}
    />
  </div>
)}

{/* Media tabs */}
{kind === 'group' ? (
  <div className="px-4 mt-5">
    <SectionTitle icon={<ImageIcon size={16} />} title={t('profile.sharedMedia', 'Shared media')} />
    <SharedMediaTabs messages={groupMessages} onOpenChat={() => { onMessage?.(); onClose(); }} />
  </div>
) : (
  <div className="px-4 mt-5">
    <div className="flex gap-1.5 overflow-x-auto">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          aria-pressed={activeTab === tab.id}
          className="group flex items-center justify-center min-w-11 min-h-11 p-1 rounded-full transition-colors"
        >
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            activeTab === tab.id
              ? 'bg-[var(--accent)] text-[var(--ink-on-saturate)]'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] group-hover:bg-[var(--msg-bg-panel-hover)]'
          }`}>
            {tab.icon} {t(tab.label, tab.fallback)}
          </span>
        </button>
      ))}
    </div>

    <div className="mt-3">
      {activeTab === 'media' && (
        <div className="grid grid-cols-3 gap-2">
          {CHAT_PROFILE_MEDIA_GRADIENTS.map((g, i) => (
            <div key={i} className={`aspect-square rounded-xl bg-gradient-to-br ${g}`} />
          ))}
        </div>
      )}
      {activeTab === 'files' && <Placeholder icon={<FileText size={20} />} text={t('profile.noFiles', 'No files yet')} />}
      {activeTab === 'links' && <Placeholder icon={<LinkIcon size={20} />} text={t('profile.noLinks', 'No links yet')} />}
      {activeTab === 'voice' && <Placeholder icon={<Mic size={20} />} text={t('profile.noVoice', 'No voice messages')} />}
    </div>
  </div>
)}

{/* Members / Admins */}
{kind === 'group' ? (
  <div className="px-4 mt-5">
    <SectionTitle icon={<Users size={16} />} title={t('profile.members', 'Members')} />
    <GroupManagementPanel
      chatId={chat.id}
      members={Array.isArray(chat.members) ? chat.members : []}
      group={chat.group ?? { inviteToken: `ma_${chat.id}`, slowModeSeconds: 0, ownerId: '' }}
    />
  </div>
) : kind === 'channel' ? (
  <div className="px-4 mt-5">
    <SectionTitle icon={<Users size={16} />} title={t('profile.administrators', 'Administrators')} />
    <div className={CARD}>
      {CHAT_PROFILE_MOCK_MEMBERS.map((name, i) => (
        <div key={name} className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 border-[var(--border-color)]">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] flex items-center justify-center text-[var(--ink-on-saturate)] font-bold">
            {name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className={MEDIUM_LABEL_CLASS}>{name}</div>
            {i === 0 && <div className="text-xs flex items-center gap-1 text-[var(--amber)]"><Crown size={12} /> {t('profile.owner', 'Owner')}</div>}
          </div>
          {i === 0 && <Shield size={16} className="text-[var(--accent)]" />}
        </div>
      ))}
    </div>
  </div>
) : null}

{/* Pinned messages (groups) */}
{kind === 'group' && (
  <div className="px-4 mt-5">
    <SectionTitle icon={<Pin size={16} />} title={t('profile.pinnedMessages', 'Pinned messages')} />
    {groupPinned.length === 0 ? (
      <DataState status="empty" isDark={isDark} title={t('group.noPinned', 'No pinned messages')} action={{ label: t('chat.openChat', 'Open chat'), onClick: () => { onMessage?.(); onClose(); } }} />
    ) : (
      <div className={CARD}>
        {groupPinned.map((p: any) => (
          <div key={p.id} className="flex items-start gap-2 px-4 py-3 border-b last:border-b-0 border-[var(--border-color)]">
            <div className="flex-1 min-w-0 text-sm text-[var(--text-primary)]">{previewOf(groupMessages, p.id)}</div>
            <button
              type="button"
              onClick={() => removePinnedMessage(p.id, chat.id)}
              aria-label={t('chat.unpin', 'Unpin')}
              className="shrink-0 min-h-11 min-w-11 px-2 rounded-lg flex items-center justify-center cursor-pointer text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-[var(--msg-bg-panel-hover)] active:scale-95 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
)}

{/* Permissions / Privacy (group admins only: toggles are no-ops otherwise) */}
{kind === 'group' && canManageGroup && (
<div className="px-4 mt-5">
  <SectionTitle icon={<Shield size={16} />} title={t('profile.permissions', 'Permissions')} />
  <div className={CARD}>
    <Row icon={<MessageCircle size={16} />} title={t('profile.sendMessages', 'Send messages')} right={<ToggleSwitch isOn={groupPerms.sendMessages} ariaLabel={t('profile.sendMessages', 'Send messages')} onToggle={() => toggleGroupPermission('sendMessages')} isDark={isDark} />} />
    <Row icon={<Users size={16} />} title={t('profile.addMembers', 'Add members')} right={<ToggleSwitch isOn={groupPerms.addMembers} ariaLabel={t('profile.addMembers', 'Add members')} onToggle={() => toggleGroupPermission('addMembers')} isDark={isDark} />} />
    <Row icon={<AtSign size={16} />} title={t('profile.mentionEveryone', 'Mention everyone')} right={<ToggleSwitch isOn={groupPerms.mentionEveryone} ariaLabel={t('profile.mentionEveryone', 'Mention everyone')} onToggle={() => toggleGroupPermission('mentionEveryone')} isDark={isDark} />} />
  </div>
</div>
)}
    </>
  );
};

const Row = ({ icon, title, right }: { icon: React.ReactNode; title: string; right?: React.ReactNode }) => (
  <div className={ROW_SHELL_CLASS}>
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${ICON_BOX}`}>{icon}</div>
      <span className="text-sm text-[var(--text-primary)]">{title}</span>
    </div>
    {right}
  </div>
);

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-3 px-4 py-3 border-b last:border-b-0 border-[var(--border-color)]">
    <span className="text-sm text-[var(--text-secondary)]">{label}</span>
    <span className="text-sm font-medium text-right text-[var(--text-primary)]">{value}</span>
  </div>
);

const SectionTitle = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
  <div className="font-mono text-xs uppercase tracking-widest font-bold mb-2 opacity-50 px-1 flex items-center gap-1.5 text-[var(--text-primary)]">{icon} {title}</div>
);

const Placeholder = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="flex flex-col items-center justify-center py-10 text-center text-[var(--text-secondary)]">
    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center mb-2 ${ICON_BOX}`}>{icon}</div>
    <div className="text-sm">{text}</div>
  </div>
);

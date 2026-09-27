import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, MessageCircle, Phone, Video, Users, Bell, BellOff, Image as ImageIcon, FileText,
  Link as LinkIcon, Mic, Shield, Crown, UserX, LogOut, Volume2, VolumeX, Info,
  Bot as BotIcon, AtSign, Globe, Lock, Trash2, Pin, UserPlus, BadgeCheck,
} from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { useAppStore } from '../store';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { previewOf } from './chat-preview/PinnedMessagesBar';
import { findCrmContactByChat } from '../lib/crm/bridge';
import { CrmCard } from './crm/CrmCard';
import { CloseButton } from './ui/CloseButton';
import { InviteQRModal } from './ui/InviteQRModal';
import { ToggleSwitch } from './ui/SettingsRow';
import { toast } from './ui/Toast';
import { DataState } from './ui/DataState';
import { channelInviteLink as buildChannelInviteLink } from '../config/app';
import type { GroupInfo, GroupMember, GroupPermissions } from '../store/slices/chatSlice';
import { canGroupPermission, getGroupRole, groupPermissionsOf } from '../store/slices/chatSlice';
import { GroupManagementPanel } from './chat/GroupManagementPanel';
import { SharedMediaTabs } from './chat/SharedMediaTabs';
import {
  CHAT_PROFILE_MEDIA_GRADIENTS,
  CHAT_PROFILE_MOCK_MEMBERS,
  CHAT_PROFILE_DEFAULT_SUBSCRIBERS,
  CHAT_PROFILE_DEFAULT_MEMBERS,
} from '../constants/chatConstants';
import { formatLongDate } from '../utils/dateTime';

export type ChatProfileKind = 'user' | 'group' | 'channel' | 'bot';

interface ChatProfileViewProps {
  open: boolean;
  chat: { id: any; name: string; color: string; type?: ChatProfileKind; online?: boolean; members?: number | GroupMember[]; subscribers?: number; subscriberCount?: number; group?: GroupInfo; bio?: string; username?: string; verified?: boolean; isChannel?: boolean; isPublic?: boolean; isPrivate?: boolean; description?: string;   postCount?: number; history?: any[]; ownerId?: string };
  isDark?: boolean;
  onClose: () => void;
  onMessage?: () => void;
  onCall?: () => void;
  onVideoCall?: () => void;
}

const TABS = [
  { id: 'media', label: 'profile.tab.media', fallback: 'Media', icon: <ImageIcon size={14} /> },
  { id: 'files', label: 'profile.tab.files', fallback: 'Files', icon: <FileText size={14} /> },
  { id: 'links', label: 'profile.tab.links', fallback: 'Links', icon: <LinkIcon size={14} /> },
  { id: 'voice', label: 'profile.tab.voice', fallback: 'Voice', icon: <Mic size={14} /> },
];

export const ChatProfileView = ({ open, chat, isDark = false, onClose, onMessage, onCall, onVideoCall }: ChatProfileViewProps) => {
  const { t, lang } = useI18n();
  const kind: ChatProfileKind = chat.type ?? (chat.isChannel ? 'channel' : 'user');
  const channelInviteLink = buildChannelInviteLink(chat.username, chat.id);
  const [activeTab, setActiveTab] = useState('media');
  const [muted, setMuted] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  const chats = useAppStore((s) => s.chats);
  const userProfile = useAppStore((s) => s.userProfile);
  const deleteGroup = useAppStore((s) => s.deleteGroup);
  const leaveGroup = useAppStore((s) => s.leaveGroup);
  const leaveChannel = useAppStore((s) => s.leaveChannel);
  const setChatMuted = useAppStore((s) => s.setChatMuted);
  const contacts = useAppStore((s) => s.contacts);
  const setContactBlocked = useAppStore((s) => s.setContactBlocked);
  const updateGroup = useAppStore((s) => s.updateGroup);
  const pinnedMessageList = useAppStore((s) => s.pinnedMessageList);
  const removePinnedMessage = useAppStore((s) => s.removePinnedMessage);
  const liveChat = (chats as any[]).find((c: any) => c.id === chat.id);
  const blockedContact = kind === 'user' || kind === 'bot'
    ? (contacts || []).find((c: any) => c.id === chat.id || c.name === chat.name)
    : undefined;
  const contactBlocked = !!blockedContact?.isBlocked;
  const liveGroup = liveChat?.group ?? chat.group;
  const myGroupRole = kind === 'group' ? getGroupRole(liveChat, userProfile.id) : null;
  const canDeleteGroup = canGroupPermission(myGroupRole, 'deleteGroup');
  const canManageGroup = canGroupPermission(myGroupRole, 'manageGroup');
  const groupPerms = groupPermissionsOf(liveGroup);
  const groupMessages: any[] = (chat as any).history ?? liveChat?.history ?? [];
  const groupDescription = (liveChat?.description ?? chat.description ?? '') as string;
  const ownerMember = ((liveChat?.members as GroupMember[] | undefined) ?? []).find((m: GroupMember) => m.id === liveGroup?.ownerId);
  const ownerName = ownerMember?.name || (liveGroup?.ownerId === userProfile.id ? (userProfile.name || t('profile.you', 'You')) : undefined);
  const groupCreatedAt: number | undefined = liveChat?.createdAt;
  const groupPinned = kind === 'group' ? pinnedMessageList.filter((p: any) => p.chatId === chat.id) : [];
  const isChatMuted = kind === 'group' || kind === 'channel' ? !!liveChat?.muted : muted;
  const crmContacts = useAppStore((s) => s.crmContacts);
  const crmDeals = useAppStore((s) => s.crmDeals);
  const crmTasks = useAppStore((s) => s.crmTasks);
  const crmMatch = useMemo(
    () =>
      kind === 'user' || kind === 'bot'
        ? findCrmContactByChat(crmContacts, chat)
        : undefined,
    [kind, crmContacts, chat],
  );

  const toggleGroupPermission = (key: keyof GroupPermissions) => {
    if (kind !== 'group' || !canManageGroup || !liveGroup) return;
    updateGroup(chat.id, {
      group: {
        ...liveGroup,
        permissions: { ...groupPerms, [key]: !groupPerms[key] },
      },
    });
  };

  const handleBlockToggle = () => {
    if (!blockedContact) return;
    setContactBlocked(blockedContact.id, !contactBlocked);
    if (!contactBlocked) toast(t('profile.blocked', 'User blocked'), 'success');
    onClose();
  };

  const subtitle = () => {
    if (kind === 'channel') {
      const subscriberCount = chat.subscriberCount ?? chat.subscribers ?? CHAT_PROFILE_DEFAULT_SUBSCRIBERS;
      const postCount = chat.postCount ?? chat.history?.length ?? 0;
      return `${t('chat.subscribers', { count: subscriberCount })} · ${t('chat.posts', { count: postCount })}`;
    }
    if (kind === 'group') {
      const memberCount = Array.isArray(chat.members) ? chat.members.length : (chat.members ?? CHAT_PROFILE_DEFAULT_MEMBERS);
      return t('profile.membersCount', { count: memberCount });
    }
    if (kind === 'bot') return t('profile.bot', 'Bot');
    return chat.online ? t('profile.online', 'online') : chat.username ?? t('profile.offline', 'last seen recently');
  };

  const actions = (
    <div className="flex items-center gap-2 mt-3">
      <button onClick={() => { onMessage?.(); onClose(); }} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-[var(--accent)] text-[var(--button-primary-text)] font-medium min-h-11 active:scale-95 transition-transform">
        <MessageCircle size={16} /> {t('profile.message', 'Message')}
      </button>
      {kind !== 'channel' && (
        <button onClick={() => { onCall?.(); onClose(); }} aria-label={t('profile.call')} className="shrink-0 w-10 h-10 min-w-11 min-h-11 rounded-xl flex items-center justify-center bg-[var(--bg-tertiary)] text-[var(--text-primary)] active:scale-95 transition-transform">
          <Phone size={16} />
        </button>
      )}
      {kind === 'user' || kind === 'bot' ? (
        <button onClick={() => { onVideoCall?.(); onClose(); }} aria-label={t('profile.video')} className="shrink-0 w-10 h-10 min-w-11 min-h-11 rounded-xl flex items-center justify-center bg-[var(--bg-tertiary)] text-[var(--text-primary)] active:scale-95 transition-transform">
          <Video size={16} />
        </button>
      ) : (
        <button
          onClick={() => {
            if (kind === 'group' || kind === 'channel') { setChatMuted(chat.id, !isChatMuted); return; }
            toast(t('profile.notificationsOff', 'Muted for this chat'), 'info');
          }}
          aria-label={t('profile.mute')}
          className="shrink-0 w-10 h-10 min-w-11 min-h-11 rounded-xl flex items-center justify-center bg-[var(--bg-tertiary)] text-[var(--text-primary)] active:scale-95 transition-transform"
        >
          {isChatMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      )}
      {kind === 'channel' && (
        <button onClick={() => setShowInvite(true)} aria-label={t('invite')} className="shrink-0 w-10 h-10 min-w-11 min-h-11 rounded-xl flex items-center justify-center bg-[var(--bg-tertiary)] text-[var(--text-primary)] active:scale-95 transition-transform">
          <UserPlus size={16} />
        </button>
      )}
    </div>
  );

  return createPortal(
    <>
      <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="fixed inset-0 z-[var(--z-modal)] flex items-stretch justify-center bg-black/40 md:bg-transparent"
        >
          <div className={`absolute md:relative md:max-w-[420px] w-full h-full flex flex-col ${isDark ? "bg-[var(--bg-secondary)]" : "bg-white"} md:my-6 md:h-[calc(100%-3rem)] md:rounded-2xl md:border border-[var(--border-color)] md:shadow-2xl overflow-hidden`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
              <h2 className={`font-bold text-lg ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{t('profile.info', 'Profile')}</h2>
              <CloseButton onClick={onClose} aria-label={t('common.close')} size="lg" />
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-none">
              {/* Identity */}
              <div className="flex flex-col items-center text-center px-5 pt-5 pb-2">
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${chat.color} flex items-center justify-center text-white text-[32px] font-bold shadow-lg relative`}>
                  {chat.name.charAt(0)}
                  {kind === 'bot' && <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center text-[11px] text-white border-2 border-white md:border-[var(--bg-secondary)]"><BotIcon size={14} /></span>}
                </div>
                <div className={`mt-2.5 font-bold text-lg flex items-center gap-1 ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>
                  {chat.name}
                  {chat.verified && <BadgeCheck size={18} className="text-[var(--accent)]" />}
                </div>
                <div className={`text-[13px] ${isDark ? "text-[var(--text-secondary)]" : "text-slate-500"}`}>{subtitle()}</div>
                {chat.username && <div className={`text-[11px] mt-0.5 ${isDark ? "text-[var(--text-secondary)]" : "text-slate-400"}`}>@{chat.username}</div>}
                {kind === 'channel' && (
                  <div className={`flex items-center gap-1 text-[11px] mt-1 ${isDark ? "text-[var(--text-secondary)]" : "text-slate-400"}`}>
                    {chat.isPublic ? <Globe size={12} /> : <Lock size={12} />}
                    <span>{chat.isPublic ? t('profile.channelPublic', 'Public channel') : t('profile.channelPrivate', 'Private channel')}</span>
                  </div>
                )}
                {chat.description && <div className={`mt-1.5 text-[11px] leading-relaxed ${isDark ? "text-[var(--text-secondary)]" : "text-slate-400"}`}>{chat.description}</div>}
                {actions}
              </div>

              {/* Channel statistics */}
              {kind === 'channel' && (
                <div className="px-4 mt-5">
                  <SectionTitle icon={<Info size={16} />} title={t('profile.statistics', 'Statistics')} isDark={isDark} />
                  <div className="grid grid-cols-3 gap-2">
                    <div className={`rounded-xl p-3 text-center ${isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]" : "bg-white border border-[var(--border-color)] shadow-sm"}`}>
                      <div className={`text-lg font-bold ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{chat.subscriberCount ?? chat.subscribers ?? CHAT_PROFILE_DEFAULT_SUBSCRIBERS}</div>
                      <div className={`text-[11px] mt-0.5 ${isDark ? "text-gray-500" : "text-slate-400"}`}>{t('profile.subscribersLabel', 'Subscribers')}</div>
                    </div>
                    <div className={`rounded-xl p-3 text-center ${isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]" : "bg-white border border-[var(--border-color)] shadow-sm"}`}>
                      <div className={`text-lg font-bold ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{chat.postCount ?? chat.history?.length ?? 0}</div>
                      <div className={`text-[11px] mt-0.5 ${isDark ? "text-gray-500" : "text-slate-400"}`}>{t('profile.postsLabel', 'Posts')}</div>
                    </div>
                    <div className={`rounded-xl p-3 text-center ${isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]" : "bg-white border border-[var(--border-color)] shadow-sm"}`}>
                      <div className={`text-sm font-bold truncate px-1 ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{chat.ownerId ? (ownerName || t('profile.owner', 'Owner')) : '—'}</div>
                      <div className={`text-[11px] mt-0.5 ${isDark ? "text-gray-500" : "text-slate-400"}`}>{t('profile.owner', 'Owner')}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Group info */}
              {kind === 'group' && (
                <div className="px-4 mt-5">
                  <SectionTitle icon={<Info size={16} />} title={t('profile.groupInfo', 'Group info')} isDark={isDark} />
                  <div className={`rounded-xl overflow-hidden ${isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]" : "bg-white border border-[var(--border-color)] shadow-sm"}`}>
                    <InfoRow label={t('profile.owner', 'Owner')} value={ownerName ?? '—'} isDark={isDark} />
                    {groupCreatedAt ? <InfoRow label={t('profile.created', 'Created')} value={formatLongDate(groupCreatedAt, lang)} isDark={isDark} /> : null}
                    <InfoRow label={t('profile.description', 'Description')} value={groupDescription || t('profile.noDescription', 'No description')} isDark={isDark} />
                  </div>
                </div>
              )}

              {/* Quick toggles */}
              <div className="px-4 mt-4 space-y-2">
                <Row icon={isChatMuted ? <BellOff size={16} /> : <Bell size={16} />} title={t('profile.mute', 'Mute')} isDark={isDark} right={<ToggleSwitch isOn={isChatMuted} onToggle={() => (kind === 'group' || kind === 'channel' ? setChatMuted(chat.id, !isChatMuted) : setMuted(v => !v))} ariaLabel={t('profile.mute', 'Mute')} isDark={isDark} />} />
              </div>

              {/* In-chat CRM card */}
              {crmMatch && (
                <div className="px-4 mt-4">
                  <CrmCard
                    contact={crmMatch}
                    deals={crmDeals}
                    tasks={crmTasks}
                    isDark={isDark}
                  />
                </div>
              )}

              {/* Media tabs */}
              {kind === 'group' ? (
                <div className="px-4 mt-5">
                  <SectionTitle icon={<ImageIcon size={16} />} title={t('profile.sharedMedia', 'Shared media')} isDark={isDark} />
                  <SharedMediaTabs messages={groupMessages} isDark={isDark} onOpenChat={() => { onMessage?.(); onClose(); }} />
                </div>
              ) : (
                <div className="px-4 mt-5">
                  <div className="flex gap-1.5 overflow-x-auto">
                    {TABS.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`group flex items-center justify-center min-w-11 min-h-11 p-1 rounded-full transition-colors ${activeTab === tab.id ? "" : (isDark ? "hover:bg-white/5" : "hover:bg-slate-100")}`}
                      >
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? "bg-[var(--accent)] text-[var(--button-primary-text)]" : (isDark ? "bg-white/5 text-gray-300" : "bg-slate-100 text-slate-600")}`}>
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
                    {activeTab === 'files' && <Placeholder icon={<FileText size={20} />} text={t('profile.noFiles', 'No files yet')} isDark={isDark} />}
                    {activeTab === 'links' && <Placeholder icon={<LinkIcon size={20} />} text={t('profile.noLinks', 'No links yet')} isDark={isDark} />}
                    {activeTab === 'voice' && <Placeholder icon={<Mic size={20} />} text={t('profile.noVoice', 'No voice messages')} isDark={isDark} />}
                  </div>
                </div>
              )}

              {/* Members / Admins */}
              {kind === 'group' ? (
                <div className="px-4 mt-5">
                  <SectionTitle icon={<Users size={16} />} title={t('profile.members', 'Members')} isDark={isDark} />
                  <GroupManagementPanel
                    chatId={chat.id}
                    members={Array.isArray(chat.members) ? chat.members : []}
                    group={chat.group ?? { inviteToken: `ma_${chat.id}`, slowModeSeconds: 0, ownerId: '' }}
                    isDark={isDark}
                  />
                </div>
              ) : kind === 'channel' ? (
                <div className="px-4 mt-5">
                  <SectionTitle icon={<Users size={16} />} title={t('profile.administrators', 'Administrators')} isDark={isDark} />
                  <div className={`rounded-xl overflow-hidden ${isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]" : "bg-white border border-[var(--border-color)] shadow-sm"}`}>
                    {CHAT_PROFILE_MOCK_MEMBERS.map((name, i) => (
                      <div key={name} className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 border-[var(--border-color)]">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] flex items-center justify-center text-white font-bold">
                          {name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className={`text-sm font-medium ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{name}</div>
                          {i === 0 && <div className={`text-xs flex items-center gap-1 ${isDark ? "text-amber-400" : "text-amber-600"}`}><Crown size={12} /> {t('profile.owner', 'Owner')}</div>}
                        </div>
                        {i === 0 && <Shield size={16} className={isDark ? "text-emerald-400" : "text-emerald-600"} />}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Pinned messages (groups) */}
              {kind === 'group' && (
                <div className="px-4 mt-5">
                  <SectionTitle icon={<Pin size={16} />} title={t('profile.pinnedMessages', 'Pinned messages')} isDark={isDark} />
                  {groupPinned.length === 0 ? (
                    <DataState status="empty" isDark={isDark} title={t('group.noPinned', 'No pinned messages')} action={{ label: t('chat.openChat', 'Open chat'), onClick: () => { onMessage?.(); onClose(); } }} />
                  ) : (
                    <div className={`rounded-xl overflow-hidden ${isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]" : "bg-white border border-[var(--border-color)] shadow-sm"}`}>
                      {groupPinned.map((p: any) => (
                        <div key={p.id} className="flex items-start gap-2 px-4 py-3 border-b last:border-b-0 border-[var(--border-color)]">
                          <div className={`flex-1 min-w-0 text-sm ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{previewOf(groupMessages, p.id)}</div>
                          <button
                            type="button"
                            onClick={() => removePinnedMessage(p.id, chat.id)}
                            aria-label={t('chat.unpin', 'Unpin')}
                            className={`shrink-0 min-h-11 min-w-11 px-2 rounded-lg flex items-center justify-center cursor-pointer ${isDark ? "text-gray-400 hover:text-red-400 hover:bg-white/5" : "text-slate-500 hover:text-red-500 hover:bg-black/5"}`}
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
                <SectionTitle icon={<Shield size={16} />} title={t('profile.permissions', 'Permissions')} isDark={isDark} />
                <div className={`rounded-xl overflow-hidden ${isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]" : "bg-white border border-[var(--border-color)] shadow-sm"}`}>
                  <Row icon={<MessageCircle size={16} />} title={t('profile.sendMessages', 'Send messages')} isDark={isDark} right={<ToggleSwitch isOn={groupPerms.sendMessages} ariaLabel={t('profile.sendMessages', 'Send messages')} onToggle={() => toggleGroupPermission('sendMessages')} isDark={isDark} />} />
                  <Row icon={<Users size={16} />} title={t('profile.addMembers', 'Add members')} isDark={isDark} right={<ToggleSwitch isOn={groupPerms.addMembers} ariaLabel={t('profile.addMembers', 'Add members')} onToggle={() => toggleGroupPermission('addMembers')} isDark={isDark} />} />
                  <Row icon={<AtSign size={16} />} title={t('profile.mentionEveryone', 'Mention everyone')} isDark={isDark} right={<ToggleSwitch isOn={groupPerms.mentionEveryone} ariaLabel={t('profile.mentionEveryone', 'Mention everyone')} onToggle={() => toggleGroupPermission('mentionEveryone')} isDark={isDark} />} />
                </div>
              </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="p-4 border-t border-[var(--border-color)] flex gap-2">
              {kind === 'user' || kind === 'bot' ? (
                blockedContact && (
                  <button onClick={handleBlockToggle} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-rose-500 bg-rose-500/10 font-medium min-h-11 active:scale-95 transition-transform">
                    <UserX size={18} /> {contactBlocked ? t('profile.unblock', 'Unblock') : t('profile.block', 'Block')}
                  </button>
                )
              ) : kind === 'group' ? (
                <button onClick={() => setLeaveOpen(true)} aria-label={t('profile.leave', 'Leave group')} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-rose-500 bg-rose-500/10 font-medium min-h-11 active:scale-95 transition-transform">
                  <LogOut size={18} /> {t('profile.leave', 'Leave')}
                </button>
              ) : (
                <button onClick={() => { leaveChannel(chat.id); toast(t('profile.left', 'You left the chat'), 'success'); onClose(); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-rose-500 bg-rose-500/10 font-medium min-h-11 active:scale-95 transition-transform">
                  <LogOut size={18} /> {t('profile.leave', 'Leave')}
                </button>
              )}
              {canDeleteGroup && (
                <button
                  onClick={() => setDeleteOpen(true)}
                  aria-label={t('group.delete', 'Delete group')}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-rose-500 bg-rose-500/10 font-medium min-w-11 min-h-11 active:scale-95 transition-transform"
                >
                  <Trash2 size={18} /> <span className="hidden sm:inline">{t('group.delete', 'Delete group')}</span>
                </button>
              )}
            </div>

            <ConfirmDialog
              isOpen={deleteOpen}
              title={t('group.deleteConfirm', 'Delete group?')}
              message={t('group.deleteMessage', 'The group and its messages will be removed.')}
              confirmLabel={t('common.delete', 'Delete')}
              cancelLabel={t('common.cancel', 'Cancel')}
              variant="danger"
              theme={isDark ? 'dark' : 'light'}
              zIndex="z-[var(--z-modal-nested)]"
              onConfirm={() => { deleteGroup(chat.id); setDeleteOpen(false); toast(t('group.deleted', 'Group deleted'), 'success'); onClose(); }}
              onCancel={() => setDeleteOpen(false)}
            />

            <ConfirmDialog
              isOpen={leaveOpen}
              title={t('group.leaveConfirm', 'Leave group?')}
              message={t('group.leaveMessage', 'Leaving as the owner deletes the group for everyone.')}
              confirmLabel={t('profile.leave', 'Leave')}
              cancelLabel={t('common.cancel', 'Cancel')}
              variant="danger"
              theme={isDark ? 'dark' : 'light'}
              zIndex="z-[var(--z-modal-nested)]"
              onConfirm={() => { leaveGroup(chat.id, userProfile.id); setLeaveOpen(false); toast(t('group.left', 'You left the group'), 'success'); onClose(); }}
              onCancel={() => setLeaveOpen(false)}
            />
          </div>
        </motion.div>
      )}
      </AnimatePresence>
      <InviteQRModal isOpen={showInvite} onClose={() => setShowInvite(false)} inviteText={channelInviteLink} isDark={isDark} t={t} />
    </>,
    document.body
  );
};

const Row = ({ icon, title, right, isDark }: { icon: React.ReactNode; title: string; right?: React.ReactNode; isDark: boolean }) => (
  <div className="flex items-center justify-between px-4 py-3">
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-white/5" : "bg-slate-100"}`}>{icon}</div>
      <span className={`text-sm ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{title}</span>
    </div>
    {right}
  </div>
);

const InfoRow = ({ label, value, isDark }: { label: string; value: string; isDark: boolean }) => (
  <div className="flex items-center justify-between gap-3 px-4 py-3 border-b last:border-b-0 border-[var(--border-color)]">
    <span className={`text-sm ${isDark ? "text-gray-400" : "text-slate-500"}`}>{label}</span>
    <span className={`text-sm font-medium text-right ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{value}</span>
  </div>
);

const SectionTitle = ({ icon, title, isDark }: { icon: React.ReactNode; title: string; isDark: boolean }) => (
  <div className={`font-mono text-xs uppercase tracking-widest font-bold mb-2 opacity-50 px-1 flex items-center gap-1.5 ${isDark ? "text-[var(--text-primary)]" : "text-slate-800"}`}>{icon} {title}</div>
);

const Placeholder = ({ icon, text, isDark }: { icon: React.ReactNode; text: string; isDark: boolean }) => (
  <div className={`flex flex-col items-center justify-center py-10 text-center ${isDark ? "text-gray-500" : "text-slate-400"}`}>
    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center mb-2 ${isDark ? "bg-white/5" : "bg-slate-100"}`}>{icon}</div>
    <div className="text-sm">{text}</div>
  </div>
);

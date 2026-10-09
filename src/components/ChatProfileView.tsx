import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, MessageCircle, Phone, Video, UserX, LogOut, Volume2, VolumeX,
  Bot as BotIcon, Globe, Lock, Trash2, UserPlus, BadgeCheck,
} from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { useAppStore } from '../store';
import { sendChatPin } from '../lib/p2p/pinSync';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { findCrmContactByChat } from '../lib/crm/bridge';
import { CloseButton } from './ui/CloseButton';
import { InviteQRModal } from './ui/InviteQRModal';
import { toast } from './ui/Toast';
import { channelInviteLink as buildChannelInviteLink } from '../config/app';
import type { GroupMember, GroupPermissions } from '../store/slices/chatSlice';
import { canGroupPermission, getGroupRole, groupPermissionsOf } from '../store/slices/chatSlice';
import {
  CHAT_PROFILE_DEFAULT_SUBSCRIBERS,
  CHAT_PROFILE_DEFAULT_MEMBERS,
} from '../constants/chatConstants';
import { ChatProfileBody, type ChatProfileKind, type ProfileChat } from './chat-profile/ChatProfileBody';
import { ChatProfileActions } from './chat-profile/ChatProfileActions';

export type { ChatProfileKind } from './chat-profile/ChatProfileBody';

interface ChatProfileViewProps {
  open: boolean;
  chat: ProfileChat;
  isDark?: boolean;
  onClose: () => void;
  onMessage?: () => void;
  onCall?: () => void;
  onVideoCall?: () => void;
}

export const ChatProfileView = ({ open, chat, isDark = false, onClose, onMessage, onCall, onVideoCall }: ChatProfileViewProps) => {
  const { t, lang } = useI18n();
  const kind: ChatProfileKind = chat.type ?? (chat.isChannel ? 'channel' : 'user');
  const channelInviteLink = buildChannelInviteLink(chat.username, chat.id);
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

  const handleMuteAction = () => {
    if (kind === 'group' || kind === 'channel') { setChatMuted(chat.id, !isChatMuted); return; }
    toast(t('profile.notificationsOff', 'Muted for this chat'), 'info');
  };

  const handleToggleMute = () => {
    if (kind === 'group' || kind === 'channel') { setChatMuted(chat.id, !isChatMuted); return; }
    setMuted((v) => !v);
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
              <h2 className={`font-bold text-lg ${isDark ? "text-[var(--text-primary)]" : "text-[var(--text-primary)]"}`}>{t('profile.info', 'Profile')}</h2>
              <CloseButton onClick={onClose} aria-label={t('common.close')} size="lg" />
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-none">
              {/* Identity */}
              <div className="flex flex-col items-center text-center px-5 pt-5 pb-2">
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${chat.color} flex items-center justify-center text-white text-[32px] font-bold shadow-lg relative`}>
                  {chat.name.charAt(0)}
                  {kind === 'bot' && <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center text-[11px] text-[var(--ink-on-saturate)] border-2 border-white md:border-[var(--bg-secondary)]"><BotIcon size={14} /></span>}
                </div>
                <div className={`mt-2.5 font-bold text-lg flex items-center gap-1 ${isDark ? "text-[var(--text-primary)]" : "text-[var(--text-primary)]"}`}>
                  {chat.name}
                  {chat.verified && <BadgeCheck size={18} className="text-[var(--accent)]" />}
                </div>
                <div className={`text-[13px] ${isDark ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]"}`}>{subtitle()}</div>
                {chat.username && <div className={`text-[11px] mt-0.5 ${isDark ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]"}`}>@{chat.username}</div>}
                {kind === 'channel' && (
                  <div className={`flex items-center gap-1 text-[11px] mt-1 ${isDark ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]"}`}>
                    {chat.isPublic ? <Globe size={12} /> : <Lock size={12} />}
                    <span>{chat.isPublic ? t('profile.channelPublic', 'Public channel') : t('profile.channelPrivate', 'Private channel')}</span>
                  </div>
                )}
                {chat.description && <div className={`mt-1.5 text-[11px] leading-relaxed ${isDark ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]"}`}>{chat.description}</div>}
                <ChatProfileActions
                  kind={kind}
                  isChatMuted={isChatMuted}
                  onMessage={onMessage}
                  onCall={onCall}
                  onVideoCall={onVideoCall}
                  onClose={onClose}
                  onMute={handleMuteAction}
                  onInvite={() => setShowInvite(true)}
                />
              </div>

              <ChatProfileBody
                chat={chat}
                kind={kind}
                isDark={isDark}
                ownerName={ownerName}
                groupCreatedAt={groupCreatedAt}
                groupDescription={groupDescription}
                crmMatch={crmMatch}
                crmDeals={crmDeals}
                crmTasks={crmTasks}
                groupMessages={groupMessages}
                groupPinned={groupPinned}
                groupPerms={groupPerms}
                canManageGroup={canManageGroup}
                isChatMuted={isChatMuted}
                onToggleMute={handleToggleMute}
                removePinnedMessage={(id: number) => { removePinnedMessage(id, chat.id); sendChatPin(chat, id, "unpin"); }}
                toggleGroupPermission={toggleGroupPermission}
                onMessage={onMessage}
                onCall={onCall}
                onVideoCall={onVideoCall}
                onClose={onClose}
              />
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
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-white/5" : "bg-black/5"}`}>{icon}</div>
      <span className={`text-sm ${isDark ? "text-[var(--text-primary)]" : "text-[var(--text-primary)]"}`}>{title}</span>
    </div>
    {right}
  </div>
);

const InfoRow = ({ label, value, isDark }: { label: string; value: string; isDark: boolean }) => (
  <div className="flex items-center justify-between gap-3 px-4 py-3 border-b last:border-b-0 border-[var(--border-color)]">
    <span className={`text-sm ${isDark ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]"}`}>{label}</span>
    <span className={`text-sm font-medium text-right ${isDark ? "text-[var(--text-primary)]" : "text-[var(--text-primary)]"}`}>{value}</span>
  </div>
);

const SectionTitle = ({ icon, title, isDark }: { icon: React.ReactNode; title: string; isDark: boolean }) => (
  <div className={`font-mono text-xs uppercase tracking-widest font-bold mb-2 opacity-50 px-1 flex items-center gap-1.5 text-[var(--text-primary)]`}>{icon} {title}</div>
);

const Placeholder = ({ icon, text, isDark }: { icon: React.ReactNode; text: string; isDark: boolean }) => (
  <div className={`flex flex-col items-center justify-center py-10 text-center ${isDark ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]"}`}>
    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center mb-2 ${isDark ? "bg-white/5" : "bg-black/5"}`}>{icon}</div>
    <div className="text-sm">{text}</div>
  </div>
);

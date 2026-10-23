import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, MessageCircle, Phone, Video, UserX, LogOut, Volume2, VolumeX,
  Trash2, UserPlus,
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
import { selfDestructOptions } from '../lib/selfDestruct';
import { ChatProfileBody, type ChatProfileKind, type ProfileChat } from './chat-profile/ChatProfileBody';
import { ChatProfileHeader } from './chat-profile/ChatProfileHeader';
/** Destructive action button in the chat profile footer (block, leave). */
const DANGER_BTN_CLASS =
  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-rose-500 bg-rose-500/10 font-medium min-h-11 active:scale-95 transition-transform';

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
  const premium = useAppStore((s) => s.premiumEntitlement?.premium);
  const chatSelfDestruct = useAppStore((s) => s.chatSelfDestruct);
  const setChatSelfDestruct = useAppStore((s) => s.setChatSelfDestruct);
  const selfDestructDefault = useAppStore((s) => s.selfDestructDefault);
  const chatWallpaper = useAppStore((s) => s.chatWallpaper);
  const setChatWallpaper = useAppStore((s) => s.setChatWallpaper);
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
  const isChatMuted = kind === 'group' || kind === 'channel' ? !!((liveChat as any)?.isMuted ?? (liveChat as any)?.muted) : muted;
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

  const autoDeleteValue = chatSelfDestruct?.[String(chat.id)] ?? selfDestructDefault ?? 'Off';
  const cycleAutoDelete = () => {
    const options = selfDestructOptions(!!premium);
    const idx = options.indexOf(autoDeleteValue);
    const next = options[(idx + 1) % options.length];
    setChatSelfDestruct(chat.id, next);
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
          <div className="absolute md:relative md:max-w-[420px] w-full h-full flex flex-col bg-[var(--bg-secondary)] md:my-6 md:h-[calc(100%-3rem)] md:rounded-2xl md:border border-[var(--border-color)] md:shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
              <h2 className="font-bold text-lg text-[var(--text-primary)]">{t('profile.info', 'Profile')}</h2>
              <CloseButton onClick={onClose} aria-label={t('common.close')} size="lg" />
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-none">
              <ChatProfileHeader
                chat={chat}
                kind={kind}
                t={t}
                autoDeleteValue={autoDeleteValue}
                onCycleAutoDelete={cycleAutoDelete}
                isChatMuted={isChatMuted}
                chatWallpaper={chatWallpaper}
                onSetWallpaper={(id, bg) => setChatWallpaper(id, bg)}
                onMessage={onMessage}
                onCall={onCall}
                onVideoCall={onVideoCall}
                onClose={onClose}
                onMute={handleMuteAction}
                onInvite={() => setShowInvite(true)}
              />

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
                  <button onClick={handleBlockToggle} className={DANGER_BTN_CLASS}>
                    <UserX size={18} /> {contactBlocked ? t('profile.unblock', 'Unblock') : t('profile.block', 'Block')}
                  </button>
                )
              ) : kind === 'group' ? (
                <button onClick={() => setLeaveOpen(true)} aria-label={t('profile.leave', 'Leave group')} className={DANGER_BTN_CLASS}>
                  <LogOut size={18} /> {t('profile.leave', 'Leave')}
                </button>
              ) : (
                <button onClick={() => { leaveChannel(chat.id); toast(t('profile.left', 'You left the chat'), 'success'); onClose(); }} className={DANGER_BTN_CLASS}>
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

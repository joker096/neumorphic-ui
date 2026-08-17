import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, MessageCircle, Phone, Video, Users, Bell, BellOff, Image as ImageIcon, FileText,
  Link as LinkIcon, Mic, Shield, Crown, Flag, UserX, LogOut, Volume2, VolumeX,
  Hash, Bot as BotIcon, AtSign,
} from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { CloseButton } from './ui/CloseButton';
import { ToggleSwitch } from './ui/SettingsRow';
import { toast } from './ui/Toast';
import {
  CHAT_PROFILE_MEDIA_GRADIENTS,
  CHAT_PROFILE_MOCK_MEMBERS,
  CHAT_PROFILE_DEFAULT_SUBSCRIBERS,
  CHAT_PROFILE_DEFAULT_MEMBERS,
} from '../constants/chatConstants';

export type ChatProfileKind = 'user' | 'group' | 'channel' | 'bot';

interface ChatProfileViewProps {
  open: boolean;
  chat: { id: any; name: string; color: string; type?: ChatProfileKind; online?: boolean; members?: number; subscribers?: number; bio?: string; username?: string; verified?: boolean; isChannel?: boolean };
  isDark?: boolean;
  onClose: () => void;
  onMessage?: () => void;
  onCall?: () => void;
  onVideoCall?: () => void;
}

const TABS = [
  { id: 'media', label: 'profile.tab.media', fallback: 'Media', icon: <ImageIcon size={16} /> },
  { id: 'files', label: 'profile.tab.files', fallback: 'Files', icon: <FileText size={16} /> },
  { id: 'links', label: 'profile.tab.links', fallback: 'Links', icon: <LinkIcon size={16} /> },
  { id: 'voice', label: 'profile.tab.voice', fallback: 'Voice', icon: <Mic size={16} /> },
];

export const ChatProfileView = ({ open, chat, isDark = false, onClose, onMessage, onCall, onVideoCall }: ChatProfileViewProps) => {
  const { t } = useI18n();
  const kind: ChatProfileKind = chat.type ?? (chat.isChannel ? 'channel' : 'user');
  const [activeTab, setActiveTab] = useState('media');
  const [muted, setMuted] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const subtitle = () => {
    if (kind === 'channel') return `${chat.subscribers ?? CHAT_PROFILE_DEFAULT_SUBSCRIBERS} subscribers`;
    if (kind === 'group') return `${chat.members ?? CHAT_PROFILE_DEFAULT_MEMBERS} members`;
    if (kind === 'bot') return t('profile.bot', 'Bot');
    return chat.online ? t('profile.online', 'online') : chat.username ?? t('profile.offline', 'last seen recently');
  };

  const actions = (
    <div className="flex items-center gap-2 mt-4">
      <button onClick={() => { onMessage?.(); onClose(); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--button-primary-text)] font-medium min-h-[44px] active:scale-95 transition-transform">
        <MessageCircle size={18} /> {t('profile.message', 'Message')}
      </button>
      {kind !== 'channel' && (
        <button onClick={() => { onCall?.(); onClose(); }} aria-label={t('profile.call')} className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--bg-tertiary)] text-[var(--text-primary)] active:scale-95 transition-transform">
          <Phone size={18} />
        </button>
      )}
      {kind === 'user' || kind === 'bot' ? (
        <button onClick={() => { onVideoCall?.(); onClose(); }} aria-label={t('profile.video')} className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--bg-tertiary)] text-[var(--text-primary)] active:scale-95 transition-transform">
          <Video size={18} />
        </button>
      ) : (
        <button onClick={() => toast(t('profile.notificationsOff', 'Muted for this chat'), 'info')} aria-label={t('profile.mute')} className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--bg-tertiary)] text-[var(--text-primary)] active:scale-95 transition-transform">
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      )}
    </div>
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="fixed inset-0 z-[130] flex items-stretch justify-center bg-black/40 md:bg-transparent"
        >
          <div className={`absolute md:relative md:max-w-[420px] w-full h-full flex flex-col ${isDark ? "bg-[var(--bg-secondary)]" : "bg-white"} md:my-6 md:h-[calc(100%-3rem)] md:rounded-2xl md:border border-[var(--border-color)] md:shadow-2xl overflow-hidden`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
              <h2 className={`font-bold text-lg ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{t('profile.info', 'Profile')}</h2>
              <CloseButton onClick={onClose} aria-label={t('common.close')} size="lg" />
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Identity */}
              <div className="flex flex-col items-center text-center px-6 pt-6 pb-2">
                <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${chat.color} flex items-center justify-center text-white text-4xl font-bold shadow-lg`}>
                  {chat.name.charAt(0)}
                  {kind === 'bot' && <span className="absolute ml-16 -mt-2 w-7 h-7 rounded-full bg-[var(--accent)] flex items-center justify-center text-xs"><BotIcon size={16} /></span>}
                </div>
                <div className={`mt-3 font-bold text-xl flex items-center gap-1 ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>
                  {chat.name}
                  {chat.verified && <span className="text-[var(--accent)]">✓</span>}
                </div>
                <div className={`text-sm ${isDark ? "text-gray-400" : "text-slate-500"}`}>{subtitle()}</div>
                {chat.username && <div className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-slate-400"}`}>@{chat.username}</div>}
                {actions}
              </div>

              {/* Quick toggles */}
              <div className="px-4 mt-4 space-y-2">
                <Row icon={muted ? <BellOff size={16} /> : <Bell size={16} />} title={t('profile.mute', 'Mute')} isDark={isDark} right={<ToggleSwitch isOn={muted} onToggle={() => setMuted(v => !v)} isDark={isDark} />} />
                <Row icon={<Bell size={16} />} title={t('profile.notifications', 'Notifications')} isDark={isDark} right={<ToggleSwitch isOn={notifications} onToggle={() => setNotifications(v => !v)} isDark={isDark} />} />
                {kind !== 'user' && <Row icon={<Hash size={16} />} title={t('profile.pinnedMessages', 'Pinned messages')} isDark={isDark} right={<ToggleSwitch isOn={pinned} onToggle={() => setPinned(v => !v)} isDark={isDark} />} />}
              </div>

              {/* Media tabs */}
              <div className="px-4 mt-5">
                <div className="flex gap-2 overflow-x-auto">
                   {TABS.map(tab => (
                     <button
                       key={tab.id}
                       onClick={() => setActiveTab(tab.id)}
                       className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium min-h-[40px] whitespace-nowrap transition-colors ${activeTab === tab.id ? "bg-[var(--accent)] text-[var(--button-primary-text)]" : (isDark ? "bg-white/5 text-gray-300" : "bg-slate-100 text-slate-600")}`}
                     >
                       {tab.icon} {t(tab.label, tab.fallback)}
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

              {/* Members / Admins */}
              {(kind === 'group' || kind === 'channel') && (
                <div className="px-4 mt-5">
                  <SectionTitle icon={<Users size={16} />} title={kind === 'channel' ? t('profile.administrators', 'Administrators') : t('profile.members', 'Members')} isDark={isDark} />
                  <div className={`rounded-xl overflow-hidden ${isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]" : "bg-white border border-[var(--border-color)] shadow-sm"}`}>
                    {CHAT_PROFILE_MOCK_MEMBERS.map((name, i) => (
                      <div key={name} className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 border-[var(--border-color)]">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--accent)] to-purple-500 flex items-center justify-center text-white font-bold">
                          {name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className={`text-sm font-medium ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{name}</div>
                          {i === 0 && <div className={`text-[11px] flex items-center gap-1 ${isDark ? "text-amber-400" : "text-amber-600"}`}><Crown size={11} /> {t('profile.owner', 'Owner')}</div>}
                        </div>
                        {i === 0 && <Shield size={16} className={isDark ? "text-emerald-400" : "text-emerald-600"} />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Permissions / Privacy */}
              <div className="px-4 mt-5">
                <SectionTitle icon={<Shield size={16} />} title={t('profile.permissions', 'Permissions')} isDark={isDark} />
                <div className={`rounded-xl overflow-hidden ${isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]" : "bg-white border border-[var(--border-color)] shadow-sm"}`}>
                  <Row icon={<MessageCircle size={16} />} title={t('profile.sendMessages', 'Send messages')} isDark={isDark} right={<ToggleSwitch isOn={true} onToggle={() => {}} isDark={isDark} />} />
                  <Row icon={<Users size={16} />} title={t('profile.addMembers', 'Add members')} isDark={isDark} right={<ToggleSwitch isOn={kind === 'group'} onToggle={() => {}} isDark={isDark} />} />
                  <Row icon={<AtSign size={16} />} title={t('profile.mentionEveryone', 'Mention everyone')} isDark={isDark} right={<ToggleSwitch isOn={false} onToggle={() => {}} isDark={isDark} />} />
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="p-4 border-t border-[var(--border-color)] flex gap-2">
              {kind === 'user' || kind === 'bot' ? (
                <button onClick={() => { toast(t('profile.blocked', 'User blocked'), 'success'); onClose(); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-rose-500 bg-rose-500/10 font-medium min-h-[44px] active:scale-95 transition-transform">
                  <UserX size={18} /> {t('profile.block', 'Block')}
                </button>
              ) : (
                <button onClick={() => { toast(t('profile.left', 'You left the chat'), 'success'); onClose(); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-rose-500 bg-rose-500/10 font-medium min-h-[44px] active:scale-95 transition-transform">
                  <LogOut size={18} /> {t('profile.leave', 'Leave')}
                </button>
              )}
              <button onClick={() => { toast(t('profile.reported', 'Report submitted'), 'info'); }} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-amber-500 bg-amber-500/10 font-medium min-h-[44px] active:scale-95 transition-transform">
                <Flag size={18} /> {t('profile.report', 'Report')}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
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

const SectionTitle = ({ icon, title, isDark }: { icon: React.ReactNode; title: string; isDark: boolean }) => (
  <div className={`font-mono text-[10px] uppercase tracking-widest font-bold mb-2 opacity-50 px-1 flex items-center gap-1.5 ${isDark ? "text-[var(--text-primary)]" : "text-slate-800"}`}>{icon} {title}</div>
);

const Placeholder = ({ icon, text, isDark }: { icon: React.ReactNode; text: string; isDark: boolean }) => (
  <div className={`flex flex-col items-center justify-center py-10 text-center ${isDark ? "text-gray-500" : "text-slate-400"}`}>
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 ${isDark ? "bg-white/5" : "bg-slate-100"}`}>{icon}</div>
    <div className="text-sm">{text}</div>
  </div>
);

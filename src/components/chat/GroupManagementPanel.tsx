import { useState } from 'react';
import { Ban, Check, Copy, Crown, Link as LinkIcon, Timer, UserPlus, VolumeX, X } from 'lucide-react';
import { useAppStore } from '../../store';
import type { GroupInfo, GroupMember } from '../../store/slices/chatSlice';
import { canGroupPermission, getGroupRole } from '../../store/slices/chatSlice';
import { useI18n } from '../../lib/i18n';

const SLOW_MODE_OPTIONS = [0, 10, 30, 60];

interface GroupManagementPanelProps {
  chatId: string;
  members: GroupMember[];
  group: GroupInfo;
  isDark: boolean;
}

export const GroupManagementPanel = ({ chatId, members, group, isDark }: GroupManagementPanelProps) => {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const { contacts, updateGroup, chats, userProfile } = useAppStore();

  // The preview layer passes a chat snapshot; read live group state from the store.
  const liveChat = (chats as any[]).find((c: any) => c.id === chatId);
  const liveMembers = (liveChat?.members as GroupMember[]) ?? members;
  const liveGroup = liveChat?.group ?? group;
  const myRole = getGroupRole(liveChat, userProfile?.id ?? '');
  const canManageGroup = canGroupPermission(myRole, 'manageGroup');
  const canManageMembers = canGroupPermission(myRole, 'manageMembers');

  const inviteUrl = `https://ma.to/${liveGroup.inviteToken}`;
  const memberIds = liveMembers.map((m) => m.id);
  const pendingContacts = contacts.filter((c) => !memberIds.includes(c.id));

  const patchMembers = (next: GroupMember[]) => updateGroup(chatId, { members: next });
  const patchGroup = (patch: Partial<GroupInfo>) => updateGroup(chatId, { group: { ...liveGroup, ...patch } });

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = inviteUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cardClass = `rounded-xl overflow-hidden ${isDark ? 'bg-[var(--bg-tertiary)] border border-[var(--border-color)]' : 'bg-white border border-[var(--border-color)] shadow-sm'}`;
  const iconWrapClass = `w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-slate-100'}`;
  const iconBtnClass = `min-w-11 min-h-11 rounded-lg flex items-center justify-center transition-colors ${isDark ? 'text-gray-400 hover:text-[var(--text-primary)] bg-white/5' : 'text-slate-500 hover:text-slate-900 bg-slate-100'}`;

  return (
    <div className="space-y-4">
      {/* Invite link (managers only) */}
      {canManageGroup && (
        <div className={cardClass}>
          <div className="flex items-center gap-3 px-4 py-3">
            <div className={iconWrapClass}><LinkIcon size={16} /></div>
            <div className="flex-1 min-w-0">
              <div className={`text-sm ${isDark ? 'text-[var(--text-primary)]' : 'text-slate-900'}`}>{t('group.inviteLink', 'Invite link')}</div>
              <div className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>{inviteUrl}</div>
            </div>
            <button onClick={() => void copyInvite()} aria-label={t('group.copyInvite', 'Copy invite link')} title={t('group.copyInvite', 'Copy invite link')} className={iconBtnClass}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      )}

      {/* Slow mode (managers only) */}
      {canManageGroup && (
        <div className={cardClass}>
          <div className="flex items-center gap-3 px-4 py-3">
            <div className={iconWrapClass}><Timer size={16} /></div>
            <div className={`flex-1 text-sm ${isDark ? 'text-[var(--text-primary)]' : 'text-slate-900'}`}>{t('group.slowMode', 'Slow mode')}</div>
            <select
              aria-label={t('group.slowMode', 'Slow mode')}
              value={liveGroup.slowModeSeconds}
              onChange={(e) => patchGroup({ slowModeSeconds: Number(e.target.value) })}
              className={`w-24 h-8 rounded-lg text-sm px-2 ${isDark ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]' : 'bg-slate-100 text-slate-900'}`}
            >
              {SLOW_MODE_OPTIONS.map((sec) => (
                <option key={sec} value={sec}>
                  {sec === 0 ? t('group.slowOff', 'Off') : `${sec}s`}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Members */}
      <div className={cardClass}>
        {liveMembers.map((m) => {
          const owner = m.role === 'owner';
          return (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 border-[var(--border-color)]">
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${m.color} flex items-center justify-center text-white font-bold`}>{m.name.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium truncate ${isDark ? 'text-[var(--text-primary)]' : 'text-slate-900'}`}>{m.name}</div>
                {owner && (
                  <div className={`text-xs flex items-center gap-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                    <Crown size={12} /> {t('group.owner', 'Owner')}
                  </div>
                )}
              </div>
              {owner || !canManageMembers ? null : (
                <>
                  <select
                    aria-label={`${m.name} ${t('group.role', 'Role')}`}
                    value={m.role}
                    onChange={(e) => patchMembers(liveMembers.map((x) => (x.id === m.id ? { ...x, role: e.target.value as GroupMember['role'] } : x)))}
                    className={`w-16 h-8 rounded-lg text-xs px-1 ${isDark ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]' : 'bg-slate-100 text-slate-900'}`}
                  >
                    <option value="admin">{t('group.admin', 'Admin')}</option>
                    <option value="member">{t('group.member', 'Member')}</option>
                  </select>
                  <button
                    onClick={() => patchMembers(liveMembers.map((x) => (x.id === m.id ? { ...x, muted: !x.muted } : x)))}
                    aria-pressed={!!m.muted}
                    aria-label={`${m.name} ${t('group.mute', 'Mute')}`}
                    title={t('group.mute', 'Mute')}
                    className={iconBtnClass}
                  >
                    <VolumeX size={16} />
                  </button>
                  <button
                    onClick={() => patchMembers(liveMembers.map((x) => (x.id === m.id ? { ...x, banned: !x.banned } : x)))}
                    aria-pressed={!!m.banned}
                    aria-label={`${m.name} ${t('group.ban', 'Ban')}`}
                    title={t('group.ban', 'Ban')}
                    className={iconBtnClass}
                  >
                    <Ban size={16} />
                  </button>
                  <button
                    onClick={() => patchMembers(liveMembers.filter((x) => x.id !== m.id))}
                    aria-label={`${m.name} ${t('group.remove', 'Remove')}`}
                    title={t('group.remove', 'Remove')}
                    className={iconBtnClass}
                  >
                    <X size={16} />
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Add members (managers only) */}
      {canManageMembers && pendingContacts.length > 0 && (
        <div className={cardClass}>
          {pendingContacts.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-2 border-b last:border-b-0 border-[var(--border-color)]">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${c.color} flex items-center justify-center text-white text-xs font-bold`}>{c.name.charAt(0)}</div>
              <div className={`flex-1 text-sm truncate ${isDark ? 'text-[var(--text-primary)]' : 'text-slate-900'}`}>{c.name}</div>
              <button
                onClick={() => patchMembers([...liveMembers, { id: c.id, name: c.name, color: c.color, role: 'member' as const }])}
                aria-label={`${t('group.addMembers', 'Add member')} ${c.name}`}
                title={t('group.addMembers', 'Add member')}
                className={iconBtnClass}
              >
                <UserPlus size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

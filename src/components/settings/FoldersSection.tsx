import React, { useState } from 'react';
import {
  FolderTree, Plus, Pencil, Trash2, GripVertical, Check, X, Users, Briefcase,
  Megaphone, Bot, Inbox, Archive, BadgeCheck,
} from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { SettingsGroup, SettingsSectionTitle, SettingsRow } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';
import { toast } from '../ui/Toast';

interface NotificationsSectionProps {
  isDark?: boolean;
  onBack: () => void;
}

type FolderIcon = 'personal' | 'work' | 'channels' | 'bots' | 'all' | 'archive' | 'custom';

interface Folder {
  id: string;
  name: string;
  icon: FolderIcon;
  includes: string[];
  badge: 'all' | 'mentions' | 'none';
}

const ICON_MAP: Record<FolderIcon, React.ReactNode> = {
  personal: <Users size={16} />,
  work: <Briefcase size={16} />,
  channels: <Megaphone size={16} />,
  bots: <Bot size={16} />,
  all: <Inbox size={16} />,
  archive: <Archive size={16} />,
  custom: <FolderTree size={16} />,
};

const INCLUDE_OPTIONS = [
  { id: 'private', label: 'Private chats' },
  { id: 'groups', label: 'Groups' },
  { id: 'channels', label: 'Channels' },
  { id: 'bots', label: 'Bots' },
  { id: 'muted', label: 'Muted' },
];

const DEFAULT_FOLDERS: Folder[] = [
  { id: 'all', name: 'All', icon: 'all', includes: ['private', 'groups', 'channels', 'bots'], badge: 'all' },
  { id: 'personal', name: 'Personal', icon: 'personal', includes: ['private'], badge: 'all' },
  { id: 'work', name: 'Work', icon: 'work', includes: ['groups'], badge: 'mentions' },
  { id: 'archive', name: 'Archive', icon: 'archive', includes: [], badge: 'none' },
];

export const FoldersSection = ({ isDark = false, onBack }: NotificationsSectionProps) => {
  const { t } = useI18n();
  const [folders, setFolders] = useState<Folder[]>(DEFAULT_FOLDERS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftIncludes, setDraftIncludes] = useState<string[]>([]);

  const startEdit = (f: Folder) => {
    setEditingId(f.id);
    setDraftName(f.name);
    setDraftIncludes([...f.includes]);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const name = draftName.trim() || 'Folder';
    setFolders(prev => prev.map(f => (f.id === editingId ? { ...f, name, includes: draftIncludes } : f)));
    setEditingId(null);
    toast(t('settings.folderSaved', 'Folder updated'), 'success');
  };

  const deleteFolder = (id: string) => {
    const f = folders.find(x => x.id === id);
    if (f && ['all', 'archive'].includes(f.icon)) {
      toast(t('settings.folderLocked', 'This folder cannot be deleted'), 'warning');
      return;
    }
    setFolders(prev => prev.filter(x => x.id !== id));
    toast(t('settings.folderDeleted', 'Folder deleted'), 'success');
  };

  const addFolder = () => {
    const id = `custom-${Date.now()}`;
    setFolders(prev => [...prev, { id, name: 'New folder', icon: 'custom', includes: ['private'], badge: 'all' }]);
    startEdit({ id, name: 'New folder', icon: 'custom', includes: ['private'], badge: 'all' });
  };

  const toggleInclude = (id: string) => {
    setDraftIncludes(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const cycleBadge = (id: string) => {
    setFolders(prev => prev.map(f => {
      if (f.id !== id) return f;
      const next = f.badge === 'all' ? 'mentions' : f.badge === 'mentions' ? 'none' : 'all';
      return { ...f, badge: next };
    }));
  };

  const badgeLabel = (b: Folder['badge']) =>
    b === 'all' ? t('settings.badge_all', 'All unread') : b === 'mentions' ? t('settings.badge_mentions', 'Mentions only') : t('settings.badge_none', 'Hidden');

  return (
    <SubView title={t('settings.folders', 'Folders')} isDark={isDark} onBack={onBack}>
      <SettingsSectionTitle title={t('settings.chatFilters', 'Chat filters')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        {folders.map((f, i) => (
          <div key={f.id}>
            {i > 0 && <div className={`border-t ${isDark ? "border-[var(--border-color)]" : "border-[var(--border-color)]"}`} />}
            {editingId === f.id ? (
              <div className="px-4 py-3">
                <div className="flex items-center gap-2 mb-3">
                  <GripVertical size={16} className={isDark ? "text-gray-600" : "text-slate-300"} />
                  <input
                    autoFocus
                    value={draftName}
                    onChange={e => setDraftName(e.target.value)}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm bg-[var(--input-bg)] text-[var(--input-text)] border border-[var(--border-color)]`}
                  />
                  <button onClick={saveEdit} aria-label={t('common.save')} className="p-2 rounded-lg min-h-11 min-w-11 bg-emerald-500 text-white active:scale-95 transition-transform"><Check size={16} /></button>
                  <button onClick={() => setEditingId(null)} aria-label={t('common.cancel')} className={`p-2 rounded-lg min-h-11 min-w-11 ${isDark ? "text-gray-400 hover:bg-white/10" : "text-slate-500 hover:bg-black/5"}`}><X size={16} /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {INCLUDE_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => toggleInclude(opt.id)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full min-h-11 transition-colors ${draftIncludes.includes(opt.id) ? "bg-[var(--accent)] text-[var(--button-primary-text)]" : (isDark ? "bg-white/5 text-gray-300" : "bg-slate-100 text-slate-600")}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3">
                <GripVertical size={16} className={isDark ? "text-gray-600" : "text-slate-300"} />
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-[var(--accent-soft)]" : "bg-[var(--accent)]/10"} text-[var(--accent)]`}>
                  {ICON_MAP[f.icon]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{f.name}</div>
                  <button onClick={() => cycleBadge(f.id)} aria-label={`${t('settings.badge', 'Badge')}: ${badgeLabel(f.badge)}`} title={`${t('settings.badge', 'Badge')}: ${badgeLabel(f.badge)}`} className={`w-9 h-9 min-w-11 flex items-center justify-center rounded-lg transition-colors ${isDark ? "text-gray-400 hover:text-[var(--accent)]" : "text-slate-500 hover:text-[var(--accent)]"}`}>
                    <BadgeCheck size={16} />
                    <span className="sr-only">{`${t('settings.badge', 'Badge')}: ${badgeLabel(f.badge)}`}</span>
                  </button>
                </div>
                <button
                  onClick={() => startEdit(f)}
                  aria-label={t('common.edit')}
                  className={`p-2 rounded-lg min-h-11 min-w-11 transition-colors ${isDark ? "text-gray-400 hover:bg-white/10" : "text-slate-500 hover:bg-black/5"}`}
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => deleteFolder(f.id)}
                  aria-label={t('common.delete')}
                  className="p-2 rounded-lg min-h-11 min-w-11 text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        ))}
        <button
          onClick={addFolder}
          aria-label={t('settings.addFolder', 'Create folder')}
          className={`w-full min-h-11 flex items-center justify-center gap-2 mt-2 rounded-lg text-sm font-medium text-[var(--accent)] transition-colors active:scale-[0.99] border border-dashed ${isDark ? "hover:bg-white/5 border-white/15" : "hover:bg-black/5 border-black/15"}`}
        >
          <Plus size={16} />
          <span>{t('settings.addFolder', 'Create folder')}</span>
        </button>
      </SettingsGroup>
    </SubView>
  );
};

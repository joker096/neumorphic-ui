import { Sheet } from './ui/Sheet';
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { X, Globe, Lock, Check, Palette, Folder } from 'lucide-react';
import { useI18n } from '../lib/i18n';

const CHANNEL_COLORS = [
  'from-slate-700 to-slate-900',
  'from-purple-500 to-fuchsia-500',
  'from-blue-500 to-indigo-500',
  'from-rose-400 to-red-500',
  'from-amber-400 to-orange-400',
  'from-emerald-400 to-teal-400',
  'from-cyan-400 to-blue-500',
  'from-pink-400 to-rose-400',
  'from-violet-500 to-purple-600',
  'from-orange-400 to-red-500',
];

interface EditChannelModalProps {
  channel: any;
  theme: 'dark' | 'light';
  onClose: () => void;
  onSave: (updated: any) => void;
}

export const EditChannelModal = ({ channel, theme, onClose, onSave }: EditChannelModalProps) => {
  const isDark = theme === 'dark';
  const { t } = useI18n();
  const chatFolders = useAppStore(s => s.chatFolders);
  const assignChatToFolder = useAppStore(s => s.assignChatToFolder);
  const unassignChatFromFolder = useAppStore(s => s.unassignChatFromFolder);

  const [name, setName] = useState(channel.name || '');
  const [desc, setDesc] = useState(channel.description || '');
  const [isPublic, setIsPublic] = useState(channel.isPublic !== false);
  const [color, setColor] = useState(channel.color || 'from-slate-700 to-slate-900');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');

  useEffect(() => {
    const currentFolder = chatFolders.find(f =>
      f.chatIds.includes(channel.id)
    );
    setSelectedFolderId(currentFolder?.id || '');
  }, [channel.id, chatFolders]);

  const handleSave = () => {
    if (!name.trim()) return;

    const updated = {
      ...channel,
      name: name.trim(),
      description: desc,
      isPublic,
      isPrivate: !isPublic,
      color,
    };

    const prevFolder = chatFolders.find(f => f.chatIds.includes(channel.id));
    if (selectedFolderId && selectedFolderId !== prevFolder?.id) {
      if (prevFolder) unassignChatFromFolder(prevFolder.id, channel.id);
      assignChatToFolder(selectedFolderId, channel.id);
    } else if (!selectedFolderId && prevFolder) {
      unassignChatFromFolder(prevFolder.id, channel.id);
    }

    onSave(updated);
    onClose();
  };

  const customFolders = chatFolders.filter(f => !f.isSystem);

  return (
    <Sheet isOpen={true} onClose={onClose} detent="large">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold tracking-tight">{t('channel.editTitle')}</h3>
          <div onClick={onClose} className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors ${isDark ? "bg-white/10 hover:bg-white/20" : "bg-black/5 hover:bg-black/10"}`}>
            <X size={16} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className={`text-xs pl-2 font-semibold tracking-wide uppercase ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('channel.nameLabel')}</label>
          <input autoFocus value={name} onChange={e => setName(e.target.value)} type="text" className={`w-full h-12 rounded-2xl px-4 outline-none transition-all ${isDark ? "bg-[#13151b] border border-white/5 focus:border-orange-500/50" : "bg-slate-50 border border-black/5 focus:border-orange-500/50"}`} placeholder={t('channel.namePlaceholder')} />
        </div>

        <div className="flex flex-col gap-2">
          <label className={`text-xs pl-2 font-semibold tracking-wide uppercase ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('channel.descLabel')}</label>
          <input value={desc} onChange={e => setDesc(e.target.value)} type="text" className={`w-full h-12 rounded-2xl px-4 outline-none transition-all ${isDark ? "bg-[#13151b] border border-white/5 focus:border-orange-500/50" : "bg-slate-50 border border-black/5 focus:border-orange-500/50"}`} placeholder={t('channel.descPlaceholder')} />
        </div>

        <div className="flex flex-col gap-2">
          <label className={`text-xs pl-2 font-semibold tracking-wide uppercase flex items-center gap-1.5 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
            <Palette size={12} /> {t('channel.colorLabel')}
          </label>
          <div className="flex flex-wrap gap-2">
            {CHANNEL_COLORS.map(c => (
              <div
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-xl cursor-pointer bg-gradient-to-br ${c} transition-transform active:scale-90 ${color === c ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-[#1a1d24] scale-110' : 'hover:scale-105'}`}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3 mt-2">
          <div onClick={() => setIsPublic(true)} className={`flex-1 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all border ${isPublic ? (isDark ? "border-orange-500 bg-orange-500/10 text-orange-400" : "border-orange-500 bg-orange-50 text-orange-600") : (isDark ? "border-white/5 bg-[#13151b] text-gray-400" : "border-black/5 bg-slate-50 text-slate-500")}`}>
            <Globe size={24} />
            <span className="text-xs font-bold">{t('channel.public')}</span>
          </div>
          <div onClick={() => setIsPublic(false)} className={`flex-1 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all border ${!isPublic ? (isDark ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-blue-500 bg-blue-50 text-blue-600") : (isDark ? "border-white/5 bg-[#13151b] text-gray-400" : "border-black/5 bg-slate-50 text-slate-500")}`}>
            <Lock size={24} />
            <span className="text-xs font-bold">{t('channel.private')}</span>
          </div>
        </div>

        {customFolders.length > 0 && (
          <div className="flex flex-col gap-2">
            <label className={`text-xs pl-2 font-semibold tracking-wide uppercase flex items-center gap-1.5 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
              <Folder size={12} /> {t('channel.folderLabel')}
            </label>
            <select
              value={selectedFolderId}
              onChange={e => setSelectedFolderId(e.target.value)}
              className={`w-full h-12 rounded-2xl px-4 outline-none transition-all text-sm ${isDark ? "bg-[#13151b] border border-white/5 focus:border-orange-500/50 text-white" : "bg-slate-50 border border-black/5 focus:border-orange-500/50 text-slate-800"}`}
            >
              <option value="">{t('channel.noFolder')}</option>
              {customFolders.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        )}

        <button onClick={handleSave} disabled={!name.trim()} className={`w-full h-14 rounded-2xl mt-4 font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 ${!name.trim() ? "opacity-50 cursor-not-allowed" : ""} ${isDark ? "bg-gradient-to-tr from-orange-500 to-orange-400 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]" : "bg-gradient-to-tr from-orange-400 to-orange-300 text-orange-950 shadow-lg"}`}>
          <Check size={20} /> {t('channel.save')}
        </button>
    </Sheet>
  );
};
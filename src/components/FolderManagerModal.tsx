import { Sheet } from './ui/Sheet';
import { useI18n } from '../lib/i18n';
import React, { useState } from 'react';
import { X, Plus, Trash2, Edit3, Check, MessageCircle, User, Bell, Briefcase, Archive, Hash, Star, Users, Folder } from 'lucide-react';
import { useAppStore, ChatFolder } from '../store';

const FOLDER_ICONS = ['Folder', 'MessageCircle', 'User', 'Bell', 'Briefcase', 'Archive', 'Star', 'Users', 'Hash'] as const;

export const FolderManagerModal = ({ theme, onClose }: { theme: 'light' | 'dark'; onClose: () => void }) => {
  const isDark = theme === 'dark';
  const { t } = useI18n();
  const chatFolders = useAppStore(s => s.chatFolders);
  const addChatFolder = useAppStore(s => s.addChatFolder);
  const updateChatFolder = useAppStore(s => s.updateChatFolder);
  const removeChatFolder = useAppStore(s => s.removeChatFolder);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAdd = () => {
    if (!newName.trim()) return;
    addChatFolder({
      id: `folder_${Date.now()}`,
      name: newName.trim(),
      icon: 'Folder',
      rules: [],
      chatIds: [],
    });
    setNewName('');
  };

  const handleRename = (id: string) => {
    if (!editName.trim()) return;
    updateChatFolder(id, { name: editName.trim() });
    setEditingId(null);
    setEditName('');
  };

  return (
    <Sheet isOpen={true} onClose={onClose} detent="large">
        <div className="flex items-center justify-between mb-6">
          <h3 className={`font-bold font-sans text-lg ${isDark ? "text-white" : "text-black"}`}>{t('folders.title')}</h3>
          <div onClick={onClose} className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${isDark ? "bg-[#1a1d24] text-gray-400 hover:text-white" : "bg-black/5 text-slate-500 hover:text-slate-800"}`}>
            <X size={16} />
          </div>
        </div>

        <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto mb-4">
          {chatFolders.filter(f => !f.isSystem).map(folder => (
            <div key={folder.id} className={`flex items-center gap-3 p-3 rounded-2xl ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-slate-50 border border-black/5"}`}>
              <Folder size={18} className={isDark ? "text-orange-400" : "text-orange-600"} />
              {editingId === folder.id ? (
                <input
                  autoFocus
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRename(folder.id)}
                  className={`flex-1 outline-none text-sm font-medium bg-transparent ${isDark ? "text-white" : "text-slate-800"}`}
                />
              ) : (
                <span className={`flex-1 text-sm font-medium ${isDark ? "text-white" : "text-slate-800"}`}>{folder.name}</span>
              )}
              <div className="flex items-center gap-1">
                {editingId === folder.id ? (
                  <div onClick={() => handleRename(folder.id)} className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer ${isDark ? "hover:bg-white/10 text-green-400" : "hover:bg-black/5 text-green-600"}`}>
                    <Check size={14} />
                  </div>
                ) : (
                  <div onClick={() => { setEditingId(folder.id); setEditName(folder.name); }} className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer ${isDark ? "hover:bg-white/10 text-gray-400" : "hover:bg-black/5 text-slate-500"}`}>
                    <Edit3 size={14} />
                  </div>
                )}
                <div onClick={() => removeChatFolder(folder.id)} className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer ${isDark ? "hover:bg-red-500/20 text-red-400" : "hover:bg-red-50 text-red-500"}`}>
                  <Trash2 size={14} />
                </div>
              </div>
            </div>
          ))}
          {chatFolders.filter(f => !f.isSystem).length === 0 && (
            <div className={`text-center py-6 text-xs ${isDark ? "text-gray-500" : "text-slate-400"}`}>
              {t('folders.empty')}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder={t('folders.namePlaceholder')}
            className={`flex-1 outline-none text-sm p-3 rounded-xl ${isDark ? "bg-[#1a1d24] text-white placeholder:text-gray-500 border border-white/5" : "bg-slate-50 text-slate-800 placeholder:text-slate-400 border border-black/5"}`}
          />
          <div
            onClick={handleAdd}
            className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-colors ${isDark ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30" : "bg-orange-100 text-orange-600 hover:bg-orange-200"}`}
          >
            <Plus size={20} />
          </div>
        </div>

        <div className={`mt-4 pt-4 border-t text-[11px] ${isDark ? "text-gray-500 border-white/5" : "text-slate-400 border-black/5"}`}>
          {t('folders.systemInfo')}
        </div>
    </Sheet>
  );
};

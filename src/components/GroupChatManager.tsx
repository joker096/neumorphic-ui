import { useState } from 'react';
import { Sheet } from './ui/Sheet';
import { useAppStore, type GroupChat } from '../store';
import { motion } from 'motion/react';
import { Users, Plus, X, Shield, Trash2, UserMinus, Check } from 'lucide-react';

interface GroupChatManagerProps {
  isOpen: boolean;
  onClose: () => void;
  editGroup?: GroupChat | null;
  isDark: boolean;
}

export function GroupChatManager({ isOpen, onClose, editGroup, isDark }: GroupChatManagerProps) {
  const { groups, createGroup, updateGroup, deleteGroup, addGroupMember, removeGroupMember, contacts } = useAppStore();
  const [name, setName] = useState(editGroup?.name || '');
  const [description, setDescription] = useState(editGroup?.description || '');
  const [selectedMembers, setSelectedMembers] = useState<string[]>(editGroup?.members || []);

  const handleSave = () => {
    if (!name.trim()) return;
    if (editGroup) {
      updateGroup(editGroup.id, { name: name.trim(), description: description.trim(), members: selectedMembers });
    } else {
      createGroup({
        name: name.trim(),
        description: description.trim(),
        members: selectedMembers,
        admins: ['current-user'],
        color: 'from-blue-400 to-indigo-500',
        isEncrypted: true,
      });
    }
    onClose();
  };

  const toggleMember = (id: string) => {
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} detent="large">
      <div className="flex flex-col gap-6 pt-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
            <Users size={24} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {editGroup ? 'Edit Group' : 'New Group'}
            </h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              {editGroup ? `Manage ${editGroup.name}` : 'Create an encrypted group chat'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              Group Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
              className={`w-full mt-1 px-4 py-3 rounded-xl text-sm outline-none transition-colors ${
                isDark
                  ? 'bg-[#1C1C1E] text-white border border-white/10 focus:border-blue-500/50'
                  : 'bg-white text-slate-800 border border-black/10 focus:border-blue-500'
              }`}
            />
          </div>

          <div>
            <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Group purpose, rules, etc."
              rows={2}
              className={`w-full mt-1 px-4 py-3 rounded-xl text-sm outline-none resize-none transition-colors ${
                isDark
                  ? 'bg-[#1C1C1E] text-white border border-white/10 focus:border-blue-500/50'
                  : 'bg-white text-slate-800 border border-black/10 focus:border-blue-500'
              }`}
            />
          </div>

          <div>
            <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              Members ({selectedMembers.length})
            </label>
            <div className={`mt-1 rounded-xl overflow-hidden border ${isDark ? 'border-white/10' : 'border-black/10'}`}>
              {contacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => toggleMember(contact.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                    selectedMembers.includes(contact.id)
                      ? isDark ? 'bg-blue-500/20' : 'bg-blue-50'
                      : isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
                  } ${isDark ? 'border-b border-white/5 last:border-b-0' : 'border-b border-black/5 last:border-b-0'}`}
                >
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${contact.color} flex items-center justify-center text-white text-xs font-bold`}>
                    {contact.name.charAt(0)}
                  </div>
                  <span className={`flex-1 text-sm text-left ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {contact.name}
                  </span>
                  {selectedMembers.includes(contact.id) && (
                    <Check size={16} className="text-blue-500" />
                  )}
                </button>
              ))}
              {contacts.length === 0 && (
                <div className={`px-4 py-8 text-center text-sm ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                  No contacts available. Add contacts first.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[var(--separator)]">
          {editGroup && (
            <button
              onClick={() => { deleteGroup(editGroup.id); onClose(); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                isDark ? 'text-red-400 hover:bg-red-500/20' : 'text-red-600 hover:bg-red-50'
              }`}
            >
              <Trash2 size={16} />
              Delete Group
            </button>
          )}
          <div className="flex gap-3 ml-auto">
            <button
              onClick={onClose}
              className={`px-6 py-3 rounded-xl text-sm font-bold transition-colors ${
                isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/5 text-slate-700 hover:bg-black/10'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || selectedMembers.length < 2}
              className={`px-6 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                !name.trim() || selectedMembers.length < 2
                  ? 'opacity-50 cursor-not-allowed'
                  : isDark
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {editGroup ? 'Save' : 'Create Group'}
            </button>
          </div>
        </div>

        {editGroup && editGroup.members.length > 0 && (
          <div>
            <label className={`text-xs font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              Current Members ({editGroup.members.length})
            </label>
            <div className="flex flex-wrap gap-2">
              {editGroup.members.map((memberId) => {
                const contact = contacts.find(c => c.id === memberId);
                return (
                  <div
                    key={memberId}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium ${
                      isDark ? 'bg-white/10 text-gray-300' : 'bg-black/5 text-slate-600'
                    }`}
                  >
                    {contact?.name || memberId.slice(0, 8)}
                    <button onClick={() => removeGroupMember(editGroup.id, memberId)} className="opacity-50 hover:opacity-100">
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}

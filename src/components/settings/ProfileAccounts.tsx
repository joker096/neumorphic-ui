import React, { useState } from 'react';
import { Check, Plus, Trash2, Pencil } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface Account {
  id: number;
  name: string;
  color: string;
}

interface ProfileAccountsProps {
  isDark: boolean;
  t: (key: string, fallback?: string | Record<string, string | number>) => string;
  accounts: Account[];
  activeId: number;
  onSelect: (id: number) => void;
  onAddAccount: (name: string) => void;
  onRename: (id: number, name: string) => void;
  onDelete: (id: number) => void;
}

export const ProfileAccounts = ({ isDark, t, accounts, activeId, onSelect, onAddAccount, onRename, onDelete }: ProfileAccountsProps) => {
  const [showAddInput, setShowAddInput] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const pendingDelete = accounts.find((acc) => acc.id === pendingDeleteId) ?? null;

  const confirmDelete = () => {
    if (pendingDeleteId !== null) {
      onDelete(pendingDeleteId);
    }
    setPendingDeleteId(null);
  };

  const startEdit = (e: React.MouseEvent, acc: Account) => {
    e.stopPropagation();
    setEditingId(acc.id);
    setEditName(acc.name);
  };

  const commitEdit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (editingId !== null && editName.trim()) {
      onRename(editingId, editName.trim());
    }
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newAccountName.trim()) {
      onAddAccount(newAccountName.trim());
      setNewAccountName("");
      setShowAddInput(false);
    }
  };

  return (
    <div className={`rounded-xl overflow-hidden mt-4 ${isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]" : "bg-white shadow-sm border border-[var(--border-color)]"}`}>
      <div className="p-4">
        <div className={`text-xs uppercase tracking-widest font-bold mb-3 ${isDark ? "text-gray-500" : "text-slate-400"}`}>
          {t('settings.accounts', 'Accounts')}
        </div>
        <div className="flex flex-col gap-2">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              onClick={() => editingId !== acc.id && onSelect(acc.id)}
              className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors min-h-11 ${isDark ? "hover:bg-[var(--hover-bg-dark)]" : "hover:bg-slate-100"}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-primary)] font-bold bg-gradient-to-br ${acc.color} flex-shrink-0`}>
                {acc.name.charAt(0)}
              </div>
              <div className="flex-1 flex flex-col overflow-hidden">
                {editingId === acc.id ? (
                  <form onSubmit={commitEdit} className="flex items-center gap-1">
                    <input
                      autoFocus
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={commitEdit}
                      className={`flex-1 min-w-0 bg-transparent outline-none text-sm font-bold border-b border-[var(--accent)] ${isDark ? "text-[var(--text-primary)]" : "text-slate-800"}`}
                    />
                    <button
                      type="submit"
                      aria-label={t('settings.save', 'Save')}
                      className="p-1 rounded-lg min-w-11 min-h-11 flex items-center justify-center bg-[var(--accent)] text-[var(--text-primary)]"
                    >
                      <Check size={14} />
                    </button>
                  </form>
                ) : (
                  <span className={`text-sm font-bold truncate ${isDark ? "text-[var(--text-primary)]" : "text-slate-800"}`}>{acc.name}</span>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {editingId !== acc.id && (
                  <button
                    type="button"
                    aria-label={t('settings.editAccount', 'Edit account')}
                    onClick={(e) => startEdit(e, acc)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isDark ? "text-gray-500 hover:text-[var(--accent)] hover:bg-white/5" : "text-slate-400 hover:text-[var(--accent)] hover:bg-slate-200"}`}
                  >
                    <Pencil size={14} />
                  </button>
                )}
                {accounts.length > 1 && editingId !== acc.id && (
                  <button
                    type="button"
                    aria-label={t('settings.deleteAccount', 'Delete account')}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingDeleteId(acc.id);
                    }}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isDark ? "text-gray-500 hover:text-red-400 hover:bg-white/5" : "text-slate-400 hover:text-red-600 hover:bg-slate-200"}`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                {activeId === acc.id && editingId !== acc.id && (
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 "bg-[var(--accent-soft)] text-[var(--accent)]"`}>
                    <Check size={14} strokeWidth={2.5} />
                  </div>
                )}
              </div>
            </div>
          ))}
          <div className={`h-[1px] w-full my-1 shrink-0 ${isDark ? "bg-white/5" : "bg-black/5"}`} />
          {showAddInput ? (
            <form onSubmit={handleSubmit} className="p-2 gap-2 flex items-center shrink-0">
              <input
                autoFocus
                type="text"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                placeholder={t('settings.newAccountPlaceholder', 'Account name...')}
                className={`flex-1 min-w-0 bg-transparent outline-none text-sm transition-colors ${isDark ? "text-[var(--text-primary)] placeholder:text-gray-500" : "text-slate-800 placeholder:text-slate-400"}`}
              />
              <button type="submit" disabled={!newAccountName.trim()} className={`p-1.5 rounded-lg flex-shrink-0 min-w-11 min-h-11 ${newAccountName.trim() ? "bg-[var(--accent)] text-[var(--text-primary)]" : (isDark ? "bg-white/10 text-gray-500" : "bg-black/10 text-slate-400")} transition-colors`}>
                <Check size={16} />
              </button>
            </form>
          ) : (
            <div
              onClick={() => setShowAddInput(true)}
              className={`flex items-center gap-3 p-3 shrink-0 rounded-2xl cursor-pointer transition-colors min-h-11 "hover:bg-[var(--hover-bg-dark)] text-[var(--accent)]"`}
            >
              <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center "bg-[var(--accent-soft)]"`}>
                <Plus size={20} />
              </div>
              <span className="text-sm font-bold">{t('settings.addAccount', 'Add Account')}</span>
            </div>
          )}
        </div>
      </div>
      <ConfirmModal
        isOpen={pendingDelete !== null}
        title={t('settings.deleteAccountTitle', 'Delete account')}
        message={t('settings.deleteAccountConfirm', { name: pendingDelete?.name ?? '' })}
        confirmLabel={t('settings.delete', 'Delete')}
        cancelLabel={t('settings.cancel', 'Cancel')}
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
};

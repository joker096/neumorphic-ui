import React, { useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface Account {
  id: number;
  name: string;
  color: string;
}

interface ProfileAccountsProps {
  isDark: boolean;
  t: (key: string, fallback?: string) => string;
  accounts: Account[];
  activeId: number;
  onSelect: (id: number) => void;
  onAddAccount: (name: string) => void;
  onDelete: (id: number) => void;
}

export const ProfileAccounts = ({ isDark, t, accounts, activeId, onSelect, onAddAccount, onDelete }: ProfileAccountsProps) => {
  const [showAddInput, setShowAddInput] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const pendingDelete = accounts.find((acc) => acc.id === pendingDeleteId) ?? null;

  const confirmDelete = () => {
    if (pendingDeleteId !== null) {
      onDelete(pendingDeleteId);
    }
    setPendingDeleteId(null);
  };

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
        <div className={`text-[10px] uppercase tracking-widest font-bold mb-3 ${isDark ? "text-gray-500" : "text-slate-400"}`}>
          {t('settings.accounts', 'Accounts')}
        </div>
        <div className="flex flex-col gap-2">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              onClick={() => onSelect(acc.id)}
              className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors min-h-[44px] ${isDark ? "hover:bg-[var(--hover-bg-dark)]" : "hover:bg-slate-100"}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-primary)] font-bold bg-gradient-to-br ${acc.color} flex-shrink-0`}>
                {acc.name.charAt(0)}
              </div>
              <div className="flex-1 flex flex-col overflow-hidden">
                <span className={`text-sm font-bold truncate ${isDark ? "text-[var(--text-primary)]" : "text-slate-800"}`}>{acc.name}</span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {accounts.length > 1 && (
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
                {activeId === acc.id && (
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? "bg-orange-500/20 text-orange-500" : "bg-orange-100 text-orange-600"}`}>
                    <Check size={14} strokeWidth={3} />
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
              <button type="submit" disabled={!newAccountName.trim()} className={`p-1.5 rounded-lg flex-shrink-0 min-w-[44px] min-h-[44px] ${newAccountName.trim() ? "bg-orange-500 text-[var(--text-primary)]" : (isDark ? "bg-white/10 text-gray-500" : "bg-black/10 text-slate-400")} transition-colors`}>
                <Check size={16} />
              </button>
            </form>
          ) : (
            <div
              onClick={() => setShowAddInput(true)}
              className={`flex items-center gap-3 p-3 shrink-0 rounded-2xl cursor-pointer transition-colors min-h-[44px] ${isDark ? "hover:bg-[var(--hover-bg-dark)] text-orange-400" : "hover:bg-slate-100 text-orange-600"}`}
            >
              <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${isDark ? "bg-orange-500/10" : "bg-orange-500/10"}`}>
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
        message={t('settings.deleteAccountConfirm', `Are you sure you want to delete "${pendingDelete?.name ?? ''}"? This cannot be undone.`)}
        confirmLabel={t('settings.delete', 'Delete')}
        cancelLabel={t('settings.cancel', 'Cancel')}
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
};

import React, { useState } from 'react';
import { Check, Trash2, Pencil } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { AccountEditForm, AccountAddSection } from './accountForms';

interface Account {
  id: number;
  name: string;
  color: string;
  username?: string;
  bio?: string;
}

interface AccountDraft {
  name: string;
  username?: string;
  bio?: string;
}

interface ProfileAccountsProps {
  isDark: boolean;
  t: (key: string, fallback?: string | Record<string, string | number>) => string;
  accounts: Account[];
  activeId: number;
  onSelect: (id: number) => void;
  onAddAccount: (draft: AccountDraft) => void;
  onUpdateAccount: (id: number, partial: Partial<Account>) => void;
  onDelete: (id: number) => void;
  canAdd: boolean;
  onGetPremium?: () => void;
}

export const ProfileAccounts = ({ isDark, t, accounts, activeId, onSelect, onAddAccount, onUpdateAccount, onDelete, canAdd, onGetPremium }: ProfileAccountsProps) => {
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

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
  };

  return (
    <div className={`rounded-xl overflow-hidden mt-4 ${isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]" : "bg-white shadow-sm border border-[var(--border-color)]"}`}>
      <div className="p-4">
        <div className={`text-xs uppercase tracking-widest font-bold mb-3 ${isDark ? "text-gray-500" : "text-slate-400"}`}>
          {t('settings.accounts', 'Accounts')}
        </div>
        <div className="flex flex-col gap-2">
          {accounts.map((acc) => (
            <div key={acc.id}>
              {editingId === acc.id ? (
                <AccountEditForm
                  isDark={isDark}
                  t={t}
                  account={acc}
                  onSave={(partial) => onUpdateAccount(acc.id, partial)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div
                  onClick={() => onSelect(acc.id)}
                  className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors min-h-11 ${isDark ? "hover:bg-[var(--hover-bg-dark)]" : "hover:bg-slate-100"}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-primary)] font-bold bg-gradient-to-br ${acc.color} flex-shrink-0`}>
                    {acc.name.charAt(0)}
                  </div>
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <span className={`text-sm font-bold truncate ${isDark ? "text-[var(--text-primary)]" : "text-slate-800"}`}>{acc.name}</span>
                    {(acc.username || acc.bio) && (
                      <span className={`text-xs truncate ${isDark ? "text-gray-500" : "text-slate-400"}`}>
                        {acc.username ? `@${acc.username}` : ''}{acc.username && acc.bio ? ' · ' : ''}{acc.bio || ''}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      aria-label={t('settings.editAccount', 'Edit account')}
                      onClick={(e) => startEdit(e, acc)}
                      className={`min-w-11 min-h-11 rounded-full flex items-center justify-center transition-colors ${isDark ? "text-gray-500 hover:text-[var(--accent)] hover:bg-white/5" : "text-slate-400 hover:text-[var(--accent)] hover:bg-slate-200"}`}
                    >
                      <Pencil size={14} />
                    </button>
                    {accounts.length > 1 && (
                      <button
                        type="button"
                        aria-label={t('settings.deleteAccount', 'Delete account')}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingDeleteId(acc.id);
                        }}
                        className={`min-w-11 min-h-11 rounded-full flex items-center justify-center transition-colors ${isDark ? "text-gray-500 hover:text-red-400 hover:bg-white/5" : "text-slate-400 hover:text-red-600 hover:bg-slate-200"}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    {activeId === acc.id && (
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-[var(--accent-soft)] text-[var(--accent)]`}>
                        <Check size={14} strokeWidth={2.5} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div className={`h-[1px] w-full my-1 shrink-0 ${isDark ? "bg-white/5" : "bg-black/5"}`} />
          <AccountAddSection
            isDark={isDark}
            t={t}
            canAdd={canAdd}
            onAddAccount={onAddAccount}
            onGetPremium={onGetPremium}
          />
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

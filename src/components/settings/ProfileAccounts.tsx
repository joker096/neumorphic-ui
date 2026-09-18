import React, { useState } from 'react';
import { Check, Plus, Trash2, Pencil, Crown } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { ACCOUNT_COLORS } from '../../constants/settingsConstants';

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

const emptyDraft = (): AccountDraft => ({ name: '', username: '', bio: '' });

export const ProfileAccounts = ({ isDark, t, accounts, activeId, onSelect, onAddAccount, onUpdateAccount, onDelete, canAdd, onGetPremium }: ProfileAccountsProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [addDraft, setAddDraft] = useState<AccountDraft>(emptyDraft);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<AccountDraft>(emptyDraft);
  const [editColor, setEditColor] = useState<string>(ACCOUNT_COLORS[0]);

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
    setEditDraft({ name: acc.name, username: acc.username || '', bio: acc.bio || '' });
    setEditColor(acc.color);
  };

  const commitEdit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (editingId !== null && editDraft.name.trim()) {
      onUpdateAccount(editingId, {
        name: editDraft.name.trim(),
        username: (editDraft.username || '').replace(/^@/, '').trim(),
        bio: (editDraft.bio || '').trim(),
        color: editColor,
      });
    }
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (addDraft.name.trim()) {
      onAddAccount({
        name: addDraft.name.trim(),
        username: (addDraft.username || '').replace(/^@/, '').trim(),
        bio: (addDraft.bio || '').trim(),
      });
      setAddDraft(emptyDraft());
      setShowAddForm(false);
    }
  };

  const inputClass = `w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none border transition-colors focus:ring-2 focus:ring-[var(--accent)]/40 bg-[var(--input-bg)] text-[var(--input-text)] border-[var(--border-color)] ${isDark ? "text-[var(--text-primary)]" : "text-slate-800"} placeholder:text-[var(--text-secondary)]`;
  const labelClass = `text-xs font-medium mb-1 block ${isDark ? "text-gray-400" : "text-slate-500"}`;

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
                <form onSubmit={commitEdit} className={`p-3 rounded-2xl flex flex-col gap-2.5 border ${isDark ? "border-[var(--accent)]/40 bg-white/5" : "border-[var(--accent)]/40 bg-slate-50"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-primary)] font-bold bg-gradient-to-br ${editColor} flex-shrink-0`}>
                      {editDraft.name.charAt(0) || '?'}
                    </div>
                    <input
                      autoFocus
                      type="text"
                      value={editDraft.name}
                      onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                      onClick={(e) => e.stopPropagation()}
                      placeholder={t('settings.newAccountPlaceholder', 'Account name...')}
                      className={`${inputClass} flex-1`}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className={labelClass}>{t('settings.accountUsername', 'Username')}</label>
                    <input
                      type="text"
                      value={editDraft.username || ''}
                      onChange={(e) => setEditDraft((d) => ({ ...d, username: e.target.value }))}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="@username"
                      className={inputClass}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className={labelClass}>{t('settings.accountBio', 'Bio')}</label>
                    <input
                      type="text"
                      value={editDraft.bio || ''}
                      onChange={(e) => setEditDraft((d) => ({ ...d, bio: e.target.value }))}
                      onClick={(e) => e.stopPropagation()}
                      placeholder={t('settings.accountBio', 'Bio')}
                      className={inputClass}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className={labelClass}>{t('settings.accountColor', 'Color')}</label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {ACCOUNT_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          aria-label={c}
                          title={t('settings.accountColor', 'Color')}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEditColor(c);
                          }}
                          className={`flex items-center justify-center min-w-11 min-h-11 p-1 rounded-full transition-transform active:scale-90`}
                        >
                          <span className={`w-8 h-8 rounded-full bg-gradient-to-br ${c} ${editColor === c ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg-secondary)]" : "opacity-70 hover:opacity-100"}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      aria-label={t('settings.cancel', 'Cancel')}
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelEdit();
                      }}
                      className={`min-h-11 px-3 rounded-lg text-sm font-medium transition-colors ${isDark ? "text-gray-400 hover:bg-white/10" : "text-slate-500 hover:bg-slate-200"}`}
                    >
                      {t('settings.cancel', 'Cancel')}
                    </button>
                    <button
                      type="submit"
                      aria-label={t('settings.save', 'Save')}
                      disabled={!editDraft.name.trim()}
                      className="min-w-11 min-h-11 px-3 rounded-lg flex items-center justify-center gap-1.5 bg-[var(--accent)] text-[var(--ink-on-saturate)] text-sm font-bold disabled:opacity-40 transition-opacity"
                    >
                      <Check size={14} />
                      <span className="hidden sm:inline">{t('settings.save', 'Save')}</span>
                    </button>
                  </div>
                </form>
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
          {showAddForm ? (
            <form onSubmit={handleSubmit} className={`p-3 rounded-2xl flex flex-col gap-2.5 border border-dashed ${isDark ? "border-[var(--border-color)]" : "border-[var(--border-color)]"}`}>
              <input
                autoFocus
                type="text"
                value={addDraft.name}
                onChange={(e) => setAddDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder={t('settings.newAccountPlaceholder', 'Account name...')}
                className={inputClass}
              />
              <input
                type="text"
                value={addDraft.username || ''}
                onChange={(e) => setAddDraft((d) => ({ ...d, username: e.target.value }))}
                placeholder={t('settings.accountUsername', 'Username')}
                className={inputClass}
              />
              <input
                type="text"
                value={addDraft.bio || ''}
                onChange={(e) => setAddDraft((d) => ({ ...d, bio: e.target.value }))}
                placeholder={t('settings.accountBio', 'Bio')}
                className={inputClass}
              />
              <div className="flex items-center gap-1.5 justify-end pt-1">
                <button
                  type="button"
                  aria-label={t('settings.cancel', 'Cancel')}
                  onClick={() => {
                    setAddDraft(emptyDraft());
                    setShowAddForm(false);
                  }}
                  className={`min-h-11 px-3 rounded-lg text-sm font-medium transition-colors ${isDark ? "text-gray-400 hover:bg-white/10" : "text-slate-500 hover:bg-slate-200"}`}
                >
                  {t('settings.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  aria-label={t('settings.addAccount', 'Add Account')}
                  disabled={!addDraft.name.trim()}
                  className={`min-w-11 min-h-11 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${addDraft.name.trim() ? "bg-[var(--accent)] text-[var(--ink-on-saturate)]" : (isDark ? "bg-white/10 text-gray-500" : "bg-black/10 text-slate-400")} disabled:opacity-60`}
                >
                  <Check size={16} />
                  <span className="hidden sm:inline text-sm font-bold">{t('settings.addAccount', 'Add Account')}</span>
                </button>
              </div>
            </form>
          ) : canAdd ? (
            <div
              onClick={() => setShowAddForm(true)}
              className={`flex items-center gap-3 p-3 shrink-0 rounded-2xl cursor-pointer transition-colors min-h-11 hover:bg-[var(--hover-bg-dark)] text-[var(--accent)]`}
            >
              <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-[var(--accent-soft)]`}>
                <Plus size={20} />
              </div>
              <span className="text-sm font-bold">{t('settings.addAccount', 'Add Account')}</span>
            </div>
          ) : (
            <div className={`flex items-center gap-3 p-3 rounded-2xl ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
              <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-amber-500/15 text-amber-500`}>
                <Crown size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-bold ${isDark ? "text-[var(--text-primary)]" : "text-slate-800"}`}>{t('settings.accountsLimit', 'Accounts limit reached')}</div>
                <div className={`text-xs mt-0.5 ${isDark ? "text-gray-500" : "text-slate-400"}`}>{t('premium.gatingAccounts', 'Unlimited accounts with Premium')}</div>
              </div>
              {onGetPremium && (
                <button
                  type="button"
                  aria-label={t('premium.crmUnlock', 'Open Premium')}
                  onClick={onGetPremium}
                  className={`min-h-11 px-3 rounded-lg text-sm font-bold transition-colors bg-amber-500 text-[var(--ink-on-saturate)] hover:brightness-110`}
                >
                  {t('premium.crmUnlock', 'Open Premium')}
                </button>
              )}
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
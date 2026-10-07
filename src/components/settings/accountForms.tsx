import { useState } from 'react';
import { Check, Plus, Crown } from 'lucide-react';
import { ACCOUNT_COLORS } from '../../constants/settingsConstants';

type T = (key: string, fallback?: string | Record<string, string | number>) => string;

interface AccountLike {
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

const emptyDraft = (): AccountDraft => ({ name: '', username: '', bio: '' });

  const inputClass = (isDark: boolean) => `w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none border transition-colors focus:ring-2 focus:ring-[var(--accent)]/40 bg-[var(--input-bg)] text-[var(--input-text)] border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]`;
  const labelClass = (isDark: boolean) => `text-xs font-medium mb-1 block ${isDark ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]"}`;

export function AccountEditForm({ isDark, t, account, onSave, onCancel }: {
  isDark: boolean;
  t: T;
  account: AccountLike;
  onSave: (partial: { name: string; username: string; bio: string; color: string }) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<AccountDraft>(() => ({ name: account.name, username: account.username || '', bio: account.bio || '' }));
  const [color, setColor] = useState<string>(account.color || ACCOUNT_COLORS[0]);

  const commit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (draft.name.trim()) {
      onSave({
        name: draft.name.trim(),
        username: (draft.username || '').replace(/^@/, '').trim(),
        bio: (draft.bio || '').trim(),
        color,
      });
    }
    onCancel();
  };

  return (
                <form onSubmit={commit} className={`p-3 rounded-2xl flex flex-col gap-2.5 border ${isDark ? "border-[var(--accent)]/40 bg-white/5" : "border-[var(--accent)]/40 bg-black/5"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-primary)] font-bold bg-gradient-to-br ${color} flex-shrink-0`}>
                      {draft.name.charAt(0) || '?'}
                    </div>
                    <input
                      aria-label={t('settings.newAccountPlaceholder', 'Account name...')}
                      autoFocus
                      type="text"
                      value={draft.name}
                      onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                      onClick={(e) => e.stopPropagation()}
                      placeholder={t('settings.newAccountPlaceholder', 'Account name...')}
                      className={`${inputClass(isDark)} flex-1`}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className={labelClass(isDark)}>{t('settings.accountUsername', 'Username')}</label>
                    <input
                      aria-label={t('settings.accountUsername', 'Username')}
                      type="text"
                      value={draft.username || ''}
                      onChange={(e) => setDraft((d) => ({ ...d, username: e.target.value }))}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="@username"
                      className={inputClass(isDark)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className={labelClass(isDark)}>{t('settings.accountBio', 'Bio')}</label>
                    <input
                      aria-label={t('settings.accountBio', 'Bio')}
                      type="text"
                      value={draft.bio || ''}
                      onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
                      onClick={(e) => e.stopPropagation()}
                      placeholder={t('settings.accountBio', 'Bio')}
                      className={inputClass(isDark)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className={labelClass(isDark)}>{t('settings.accountColor', 'Color')}</label>
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
                            setColor(c);
                          }}
                          className={`flex items-center justify-center min-w-11 min-h-11 p-1 rounded-full transition-transform active:scale-90`}
                        >
                          <span className={`w-8 h-8 rounded-full bg-gradient-to-br ${c} ${color === c ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg-secondary)]" : "opacity-70 hover:opacity-100"}`} />
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
                        onCancel();
                      }}
                      className={`min-h-11 px-3 rounded-lg text-sm font-medium transition-colors ${isDark ? "text-[var(--text-secondary)] hover:bg-white/10" : "text-[var(--text-tertiary)] hover:bg-black/10"}`}
                    >
                      {t('settings.cancel', 'Cancel')}
                    </button>
                    <button
                      type="submit"
                      aria-label={t('settings.save', 'Save')}
                      disabled={!draft.name.trim()}
                      className="min-w-11 min-h-11 px-3 rounded-lg flex items-center justify-center gap-1.5 bg-[var(--accent)] text-[var(--ink-on-saturate)] text-sm font-bold disabled:opacity-40 transition-opacity"
                    >
                      <Check size={14} />
                      <span className="hidden sm:inline">{t('settings.save', 'Save')}</span>
                    </button>
                  </div>
                </form>
  );
}

export function AccountAddSection({ isDark, t, canAdd, onAddAccount, onGetPremium }: {
  isDark: boolean;
  t: T;
  canAdd: boolean;
  onAddAccount: (draft: AccountDraft) => void;
  onGetPremium?: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<AccountDraft>(emptyDraft);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (draft.name.trim()) {
      onAddAccount({
        name: draft.name.trim(),
        username: (draft.username || '').replace(/^@/, '').trim(),
        bio: (draft.bio || '').trim(),
      });
      setDraft(emptyDraft());
      setShowForm(false);
    }
  };

  if (showForm) {
    return (
            <form onSubmit={submit} className={`p-3 rounded-2xl flex flex-col gap-2.5 border border-dashed ${isDark ? "border-[var(--border-color)]" : "border-[var(--border-color)]"}`}>
              <input
                aria-label={t('settings.newAccountPlaceholder', 'Account name...')}
                autoFocus
                type="text"
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder={t('settings.newAccountPlaceholder', 'Account name...')}
                className={inputClass(isDark)}
              />
              <input
                aria-label={t('settings.accountUsername', 'Username')}
                type="text"
                value={draft.username || ''}
                onChange={(e) => setDraft((d) => ({ ...d, username: e.target.value }))}
                placeholder={t('settings.accountUsername', 'Username')}
                className={inputClass(isDark)}
              />
              <input
                aria-label={t('settings.accountBio', 'Bio')}
                type="text"
                value={draft.bio || ''}
                onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
                placeholder={t('settings.accountBio', 'Bio')}
                className={inputClass(isDark)}
              />
              <div className="flex items-center gap-1.5 justify-end pt-1">
                <button
                  type="button"
                  aria-label={t('settings.cancel', 'Cancel')}
                  onClick={() => {
                    setDraft(emptyDraft());
                    setShowForm(false);
                  }}
                  className={`min-h-11 px-3 rounded-lg text-sm font-medium transition-colors ${isDark ? "text-[var(--text-secondary)] hover:bg-white/10" : "text-[var(--text-tertiary)] hover:bg-black/10"}`}
                >
                  {t('settings.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  aria-label={t('settings.addAccount', 'Add Account')}
                  disabled={!draft.name.trim()}
                  className={`min-w-11 min-h-11 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${draft.name.trim() ? "bg-[var(--accent)] text-[var(--ink-on-saturate)]" : (isDark ? "bg-white/10 text-[var(--text-secondary)]" : "bg-black/10 text-[var(--text-tertiary)]")} disabled:opacity-60`}
                >
                  <Check size={16} />
                  <span className="hidden sm:inline text-sm font-bold">{t('settings.addAccount', 'Add Account')}</span>
                </button>
              </div>
            </form>
    );
  }
  if (canAdd) {
    return (
            <div
              onClick={() => setShowForm(true)}
              className={`flex items-center gap-3 p-3 shrink-0 rounded-2xl cursor-pointer transition-colors min-h-11 hover:bg-[var(--hover-bg-dark)] text-[var(--accent)]`}
            >
              <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-[var(--accent-soft)]`}>
                <Plus size={20} />
              </div>
              <span className="text-sm font-bold">{t('settings.addAccount', 'Add Account')}</span>
            </div>
    );
  }
  return (
            <div className={`flex items-center gap-3 p-3 rounded-2xl ${isDark ? "bg-white/5" : "bg-black/5"}`}>
              <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-amber-500/15 text-amber-500`}>
                <Crown size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-bold text-[var(--text-primary)]`}>{t('settings.accountsLimit', 'Accounts limit reached')}</div>
                <div className={`text-xs mt-0.5 ${isDark ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]"}`}>{t('premium.gatingAccounts', 'Unlimited accounts with Premium')}</div>
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
  );
}

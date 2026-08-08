import React, { useState } from 'react';
import { Plus, Check, QrCode, Copy, Share2, X } from 'lucide-react';
import { SubView } from '../ui/SubView';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { motion, AnimatePresence } from 'motion/react';

interface AccountSectionProps {
  isDark?: boolean;
  onBack: () => void;
  t: (key: string, options?: any) => string;
}

interface Account {
  id: number;
  name: string;
  color: string;
}

const ACCOUNT_COLORS = [
  "from-blue-500 to-cyan-500",
  "from-purple-500 to-indigo-500",
  "from-green-500 to-emerald-500",
  "from-pink-500 to-rose-500",
  "from-yellow-500 to-orange-500",
];

export const AccountSection = ({ isDark = false, onBack, t }: AccountSectionProps) => {
  const [activeId, setActiveId] = useState<number>(1);
  const [accounts, setAccounts] = useLocalStorage<Account[]>("app_accounts", [
    { id: 1, name: "Nexus Terminal", color: "from-blue-500 to-cyan-500" },
    { id: 2, name: "Work Node", color: "from-purple-500 to-indigo-500" },
  ]);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newName, setNewName] = useState("");
  const [showShareId, setShowShareId] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleAddAccount = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newName.trim()) {
      const color = ACCOUNT_COLORS[accounts.length % ACCOUNT_COLORS.length];
      const newAcc: Account = { id: Date.now(), name: newName.trim(), color };
      setAccounts([...accounts, newAcc]);
      setActiveId(newAcc.id);
      setNewName("");
      setShowAddInput(false);
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText("nexus://id/fingerprint").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleRestoreIdentity = () => {
    window.dispatchEvent(new CustomEvent('show-login'));
    setShowShareId(false);
  };

  const activeAcc = accounts.find(a => a.id === activeId) || accounts[0];

  return (
    <SubView title={t('settings.account')} isDark={isDark} onBack={onBack}>
      <div className="absolute right-4 top-4 flex gap-2">
        <button
          onClick={handleRestoreIdentity}
          className={`p-2 rounded-full transition-colors ${isDark ? "hover:bg-white/10 text-gray-400" : "hover:bg-black/5 text-slate-500"}`}
          title={t('settings.restoreIdentity', 'Restore Identity')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
            <path d="M16 16h5v5"/>
          </svg>
        </button>
        <button
          onClick={() => setShowShareId(true)}
          className={`p-2 rounded-full transition-colors ${isDark ? "hover:bg-white/10 text-gray-400" : "hover:bg-black/5 text-slate-500"}`}
          title={t('settings.shareIdentity')}
        >
          <Share2 size={18} />
        </button>
      </div>
      <div className={`rounded-xl overflow-hidden ${isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]" : "bg-white shadow-sm border border-[var(--border-color)]"}`}>
        <div className="p-4">
          <div className={`text-[10px] uppercase tracking-widest font-bold mb-3 ${isDark ? "text-gray-500" : "text-slate-400"}`}>
            {t('settings.accounts')}
          </div>
          <div className="flex flex-col gap-2">
            {accounts.map(acc => (
              <div
                key={acc.id}
                onClick={() => setActiveId(acc.id)}
                className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors ${isDark ? "hover:bg-[var(--hover-bg-dark)]" : "hover:bg-slate-100"}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-primary)] font-bold bg-gradient-to-br ${acc.color} flex-shrink-0`}>
                  {acc.name.charAt(0)}
                </div>
                <div className="flex-1 flex flex-col overflow-hidden">
                  <span className={`text-sm font-bold truncate ${isDark ? "text-[var(--text-primary)]" : "text-slate-800"}`}>{acc.name}</span>
                </div>
                {activeId === acc.id && (
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? "bg-orange-500/20 text-orange-500" : "bg-orange-100 text-orange-600"}`}>
                    <Check size={14} strokeWidth={3} />
                  </div>
                )}
              </div>
            ))}
            <div className={`h-[1px] w-full my-1 shrink-0 ${isDark ? "bg-white/5" : "bg-black/5"}`} />
            {showAddInput ? (
              <form onSubmit={handleAddAccount} className="p-2 gap-2 flex items-center shrink-0">
                <input
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={t('settings.newAccountPlaceholder')}
                  className={`flex-1 min-w-0 bg-transparent outline-none text-sm transition-colors ${isDark ? "text-[var(--text-primary)] placeholder:text-gray-500" : "text-slate-800 placeholder:text-slate-400"}`}
                />
                <button type="submit" disabled={!newName.trim()} className={`p-1.5 rounded-lg flex-shrink-0 ${newName.trim() ? "bg-orange-500 text-[var(--text-primary)]" : (isDark ? "bg-white/10 text-gray-500" : "bg-black/10 text-slate-400")} transition-colors`}>
                  <Check size={16} />
                </button>
              </form>
            ) : (
              <div
                onClick={() => setShowAddInput(true)}
                className={`flex items-center gap-3 p-3 shrink-0 rounded-2xl cursor-pointer transition-colors ${isDark ? "hover:bg-[var(--hover-bg-dark)] text-orange-400" : "hover:bg-slate-100 text-orange-600"}`}
              >
                <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${isDark ? "bg-orange-500/10" : "bg-orange-500/10"}`}>
                  <Plus size={20} />
                </div>
                <span className="text-sm font-bold">{t('settings.addAccount')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`rounded-xl overflow-hidden mt-4 ${isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]" : "bg-white shadow-sm border border-[var(--border-color)]"}`}>
        <div className="p-4">
          <button
            onClick={handleRestoreIdentity}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors ${isDark ? "hover:bg-[var(--hover-bg-dark)] text-orange-400" : "hover:bg-slate-100 text-orange-600"}`}
          >
            <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${isDark ? "bg-orange-500/10" : "bg-orange-500/10"}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                <path d="M16 16h5v5"/>
              </svg>
            </div>
            <span className="text-sm font-bold">{t('settings.restoreIdentity')}</span>
          </button>
          <p className={`text-xs mt-2 px-1 ${isDark ? "text-gray-500" : "text-slate-400"}`}>{t('settings.restoreIdentityDescription')}</p>
        </div>
      </div>

      {/* Share Identity Modal */}
      {showShareId && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className={`w-full max-w-[340px] p-6 shadow-2xl relative ${isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]" : "bg-white border border-[var(--border-color)]"}`}
          >
            <button
              type="button"
              className={`absolute top-4 right-4 z-10 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center cursor-pointer transition-colors ${isDark ? "bg-white/10 hover:bg-white/20 text-[var(--text-primary)]" : "bg-black/5 hover:bg-black/10 text-slate-800"}`}
              onClick={() => setShowShareId(false)}
              title={t('contacts.close')}
              aria-label={t('contacts.close')}
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center mt-4">
              <h3 className={`text-xl font-bold mb-2 ${isDark ? "text-[var(--text-primary)]" : "text-slate-800"}`}>{t('settings.shareIdentity')}</h3>
              <p className={`text-xs text-center mb-6 px-4 ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.shareDescription')}</p>
              
              <div className={`w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] flex items-center justify-center p-4 shadow-xl mb-6 ${isDark ? "bg-white" : "bg-white border-2 border-gray-100"}`}>
                  <QrCode size="100%" strokeWidth={1} className="text-[var(--text-secondary)]" />
              </div>
              
              <div className={`w-full p-4 rounded-2xl flex flex-col items-center gap-3 ${isDark ? "bg-[var(--bg-secondary)] border border-[var(--border-color)]" : "bg-slate-50 border border-[var(--border-color)]"}`}>
                  <div className={`font-mono text-xs tracking-widest break-all text-center ${isDark ? "text-orange-400" : "text-orange-600"}`}>
                    nexus://id/fingerprint
                  </div>
                  <div className="flex gap-2 w-full">
                     <button onClick={handleCopyId} className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl font-bold text-xs transition-colors ${copied ? "bg-green-500 text-[var(--text-primary)]" : (isDark ? "bg-white/10 hover:bg-white/20 text-[var(--text-primary)]" : "bg-white shadow hover:bg-gray-50 text-slate-800")}`}>
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? t('header.copied') : t('settings.copyLink')}
                     </button>
                     <button className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-xl transition-colors ${isDark ? "bg-white/10 hover:bg-white/20 text-[var(--text-primary)]" : "bg-white shadow hover:bg-gray-50 text-slate-800"}`}>
                        <Share2 size={14} />
                     </button>
                  </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </SubView>
  );
};




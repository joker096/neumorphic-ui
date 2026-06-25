import React, { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import { SubView } from '../ui/SubView';

interface AccountSectionProps {
  isDark: boolean;
  onBack: () => void;
  t: (key: string, options?: any) => string;
}

export const AccountSection = ({ isDark, onBack, t }: AccountSectionProps) => {
  const [activeId, setActiveId] = useState(1);
  const [accounts, setAccounts] = useState([
    { id: 1, name: "Nexus Terminal", color: "from-blue-500 to-cyan-500" },
    { id: 2, name: "Work Node", color: "from-purple-500 to-indigo-500" }
  ]);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newName, setNewName] = useState("");

  const handleAddAccount = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newName.trim()) {
      const colors = ["from-green-500 to-emerald-500", "from-pink-500 to-rose-500", "from-yellow-500 to-orange-500"];
      const color = colors[accounts.length % colors.length];
      const newAcc = { id: Date.now(), name: newName.trim(), color };
      setAccounts([...accounts, newAcc]);
      setActiveId(newAcc.id);
      setNewName("");
      setShowAddInput(false);
    }
  };

  const activeAcc = accounts.find(a => a.id === activeId) || accounts[0];

  return (
    <SubView title={t('settings.account')} isDark={isDark} onBack={onBack}>
      <div className={`rounded-xl overflow-hidden ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white shadow-sm border border-black/5"}`}>
        <div className="p-4">
          <div className={`text-[10px] uppercase tracking-widest font-bold mb-3 ${isDark ? "text-gray-500" : "text-slate-400"}`}>
            {t('settings.accounts')}
          </div>
          <div className="flex flex-col gap-2">
            {accounts.map(acc => (
              <div
                key={acc.id}
                onClick={() => setActiveId(acc.id)}
                className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors ${isDark ? "hover:bg-[#20242e]" : "hover:bg-slate-100"}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-br ${acc.color} flex-shrink-0`}>
                  {acc.name.charAt(0)}
                </div>
                <div className="flex-1 flex flex-col overflow-hidden">
                  <span className={`text-sm font-bold truncate ${isDark ? "text-white" : "text-slate-800"}`}>{acc.name}</span>
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
                  className={`flex-1 min-w-0 bg-transparent outline-none text-sm transition-colors ${isDark ? "text-white placeholder:text-gray-500" : "text-slate-800 placeholder:text-slate-400"}`}
                />
                <button type="submit" disabled={!newName.trim()} className={`p-1.5 rounded-lg flex-shrink-0 ${newName.trim() ? "bg-orange-500 text-white" : (isDark ? "bg-white/10 text-gray-500" : "bg-black/10 text-slate-400")} transition-colors`}>
                  <Check size={16} />
                </button>
              </form>
            ) : (
              <div
                onClick={() => setShowAddInput(true)}
                className={`flex items-center gap-3 p-3 shrink-0 rounded-2xl cursor-pointer transition-colors ${isDark ? "hover:bg-[#20242e] text-orange-400" : "hover:bg-slate-100 text-orange-600"}`}
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
    </SubView>
  );
};

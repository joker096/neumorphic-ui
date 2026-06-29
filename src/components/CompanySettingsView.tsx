import React, { useState } from 'react';
import { X, Edit, Check } from 'lucide-react';
import { useAppStore } from '../store';

export const CompanySettingsView: React.FC<{
  onClose: () => void;
  isDark: boolean;
}> = ({ onClose, isDark }) => {
  const companySettings = useAppStore(s => s.companySettings);
  const setCompanyName = useAppStore(s => s.setCompanyName);
  const setCompanySettings = useAppStore(s => s.setCompanySettings);

  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(companySettings?.name || '');

  const handleSaveName = () => {
    if (tempName.trim()) {
      setCompanyName(tempName.trim());
      setCompanySettings({ ...companySettings, name: tempName.trim() });
    }
    setEditingName(false);
  };

  const handleCancelName = () => {
    setTempName(companySettings?.name || '');
    setEditingName(false);
  };

  const currentName = companySettings?.name || '';

  return (
    <div className="absolute inset-0 z-70 flex flex-col">
      <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? "border-white/5 bg-[#1a1d24]/80" : "border-black/5 bg-white/80"}`}>
        <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-800"}`}>Company Settings</h2>
        <button onClick={onClose} className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? "text-gray-400 hover:text-white hover:bg-white/10" : "text-slate-400 hover:text-slate-800 hover:bg-black/5"}`}>
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Company Name */}
        <div className={`p-4 rounded-2xl ${isDark ? "bg-[#13151b] border border-white/5" : "bg-white border border-black/5 shadow-sm"}`}>
          <div className="flex items-center justify-between mb-3">
            <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-gray-400" : "text-slate-500"}`}>Company Name</label>
            {!editingName && (
              <button onClick={() => setEditingName(true)} className={`${isDark ? "text-orange-400 hover:text-orange-300" : "text-orange-500 hover:text-orange-600"}`}>
                <Edit size={14} />
              </button>
            )}
          </div>

          {editingName ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className={`flex-1 outline-none text-sm rounded-lg px-2 py-1 ${isDark ? "bg-white/5 text-white" : "bg-black/5 text-slate-800"}`}
                autoFocus
              />
              <button onClick={handleSaveName} className={`px-3 py-1 rounded-lg text-xs font-bold ${isDark ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : "bg-green-100 text-green-600"}`}>
                <Check size={14} className="inline mr-1" /> Save
              </button>
              <button onClick={handleCancelName} className={`px-3 py-1 rounded-lg text-xs font-bold ${isDark ? "bg-white/5 text-gray-400 hover:bg-white/10" : "bg-black/5 text-slate-500 hover:bg-black/10"}`}>
                Cancel
              </button>
            </div>
          ) : (
            <div className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-800"}`}>
              {currentName || <span className={`italic ${isDark ? "text-gray-500" : "text-slate-400"}`}>Not set</span>}
            </div>
          )}
        </div>

        {/* Company Info */}
        <div className={`p-4 rounded-2xl ${isDark ? "bg-[#13151b] border border-white/5" : "bg-white border border-black/5 shadow-sm"}`}>
          <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-gray-400" : "text-slate-500"}`}>Company ID</label>
          <div className={`text-sm font-mono mt-1 ${isDark ? "text-gray-400" : "text-slate-600"}`}>
            {companySettings?.name ? 'N/A' : 'N/A'}
          </div>
        </div>

        {/* Members Management */}
        <div className={`p-4 rounded-2xl ${isDark ? "bg-[#13151b] border border-white/5" : "bg-white border border-black/5 shadow-sm"}`}>
          <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-gray-400" : "text-slate-500"}`}>Team Members</label>
          <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-slate-600"}`}>Manage team member access and roles</p>
        </div>
      </div>
    </div>
  );
};

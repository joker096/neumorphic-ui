import React, { useState, useEffect } from 'react';
import { Building2, Check, Loader2 } from 'lucide-react';
import { useAppStore } from '../../store';
import { useI18n } from '../../lib/i18n';
import { AppModal } from '../ui/AppModal';

type CreateCompanyModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const CreateCompanyModal = ({ isOpen, onClose }: CreateCompanyModalProps) => {
  const isDark = true;
  const { t } = useI18n();
  const createCompany = useAppStore(s => s.createCompany);
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    return () => {
      setSuccess(false);
      setName('');
      setDisplayName('');
      setError(null);
    };
  }, []);

  const handleCreate = async () => {
    if (!name.trim() || !displayName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await createCompany(name.trim(), displayName.trim());
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setName('');
        setDisplayName('');
      }, 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppModal isOpen={isOpen} onClose={onClose} isDark={isDark} title={t('company.createTitle', 'Create Company')} maxWidth="max-w-sm">
      {success ? (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check size={32} className="text-green-400" />
          </div>
          <p className="text-sm font-medium text-center">{t('company.createdSuccessfully', 'Company created successfully')}</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <label className={`text-xs pl-2 font-semibold tracking-wide uppercase ${isDark ? "text-gray-400" : "text-slate-500"}`}>
              {t('company.name', 'Company Name')}
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              className={`w-full h-12 rounded-2xl px-4 outline-none transition-all ${isDark ? "bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-orange-500/50" : "bg-slate-50 border border-[var(--border-color)] focus:border-orange-500/50"}`}
              placeholder={t('company.namePlaceholder', 'Acme Inc.')}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={`text-xs pl-2 font-semibold tracking-wide uppercase ${isDark ? "text-gray-400" : "text-slate-500"}`}>
              {t('company.yourName', 'Your Name')}
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              type="text"
              className={`w-full h-12 rounded-2xl px-4 outline-none transition-all ${isDark ? "bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-orange-500/50" : "bg-slate-50 border border-[var(--border-color)] focus:border-orange-500/50"}`}
              placeholder={t('company.displayNamePlaceholder', 'John Doe')}
            />
          </div>

          {error && (
            <p className={`text-xs ${isDark ? "text-red-400" : "text-red-600"}`}>{error}</p>
          )}

          <button
            onClick={handleCreate}
            disabled={!name.trim() || !displayName.trim() || loading}
            className={`w-full h-14 rounded-2xl mt-4 font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 ${(!name.trim() || !displayName.trim() || loading) ? "opacity-50 cursor-not-allowed" : ""} ${isDark ? "bg-gradient-to-tr from-orange-500 to-orange-400 text-[var(--text-primary)] shadow-[0_0_20px_rgba(249,115,22,0.3)]" : "bg-gradient-to-tr from-orange-400 to-orange-300 text-orange-950 shadow-lg"}`}
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Building2 size={20} />
            )}
            {loading ? t('company.creating', 'Creating...') : t('company.create', 'Create Company')}
          </button>
        </>
      )}
    </AppModal>
  );
};

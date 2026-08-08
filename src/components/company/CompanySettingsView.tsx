import React, { useState, useEffect } from 'react';
import { X, Phone, Mail, MapPin, Globe, FileText, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../../store';
import { useI18n } from '../../lib/i18n';
import { getCompanySettings, saveCompanySettings } from '../../lib/idb';
import { MOCK_COMPANY_SETTINGS } from '../../constants/companyMockData';
import { FormField } from '../ui/FormField';

const closeBtnStyle = 'w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all bg-black/5 hover:bg-black/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)]';

type CompanySettingsViewProps = {
  onClose: () => void;
};

const FIELDS: { key: string; icon: React.ElementType | null; label: string; type: string; placeholder: string }[] = [
  { key: 'name', icon: null, label: 'company.name', type: 'text', placeholder: 'company.namePlaceholder' },
  { key: 'phone', icon: Phone, label: 'company.phone', type: 'tel', placeholder: 'company.phonePlaceholder' },
  { key: 'email', icon: Mail, label: 'company.email', type: 'email', placeholder: 'company.emailPlaceholder' },
  { key: 'address', icon: MapPin, label: 'company.address', type: 'text', placeholder: 'company.addressPlaceholder' },
  { key: 'website', icon: Globe, label: 'company.website', type: 'url', placeholder: 'company.websitePlaceholder' },
  { key: 'taxId', icon: FileText, label: 'company.taxId', type: 'text', placeholder: 'company.taxIdPlaceholder' },
];

export const CompanySettingsView: React.FC<CompanySettingsViewProps> = ({ onClose }) => {
  const { t } = useI18n();
  const storeSettings = useAppStore(s => s.companySettings);
  const setCompanySettings = useAppStore(s => s.setCompanySettings);

  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await getCompanySettings();
      const data = stored || storeSettings || MOCK_COMPANY_SETTINGS;
      setForm(Object.fromEntries(FIELDS.map(f => [f.key, (data as any)?.[f.key] || ''])));
      setLoading(false);
    })();
  }, []);

  const handleChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settings = { ...form };
      await saveCompanySettings(settings);
      setCompanySettings(settings as any);
      toast.success(t('company.settingsSaved', 'Company settings saved'));
      onClose();
    } catch {
      toast.error(t('company.settingsSaveFailed', 'Failed to save company settings'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="absolute inset-0 z-[100] flex flex-col bg-[var(--bg-primary)]/95">
        <div className="flex items-center justify-between px-4 py-3 md:px-20 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/80">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">{t('company.settingsTitle', 'Company Settings')}</h2>
          <button onClick={onClose} className={closeBtnStyle}>
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-[var(--text-secondary)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-[100] flex flex-col bg-[var(--bg-primary)]/95">
      <div className="flex items-center justify-between px-4 py-3 md:px-20 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/80">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">{t('company.settingsTitle', 'Company Settings')}</h2>
        <button onClick={onClose} className={closeBtnStyle}>
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:px-20 space-y-3">
        {FIELDS.map(f => (
          <div key={f.key} className="p-4 rounded-md neu-card-inset">
            <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-2 block">
              {t(f.label)}
            </label>
            <div className="flex items-center gap-3">
              {f.icon && (
                <div className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center shrink-0 bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                  {React.createElement(f.icon, { size: 16 })}
                </div>
              )}
              <FormField
                value={form[f.key] || ''}
                onChange={(value) => handleChange(f.key, value)}
                type={f.type}
                inputMode={f.type as any}
                placeholder={t(f.placeholder)}
                theme="dark"
                className="flex-1"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 md:px-20 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/80">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full min-h-[44px] rounded-xl flex items-center justify-center gap-2 font-bold text-sm cursor-pointer transition-all bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:brightness-110 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {saving ? t('company.saving', 'Saving...') : t('company.saveSettings', 'Save Settings')}
        </button>
      </div>
    </div>
  );
};


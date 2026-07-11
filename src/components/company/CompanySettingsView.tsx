import React from 'react';
import { X, Phone, Mail, MapPin, Globe, FileText } from 'lucide-react';
import { useAppStore } from '../../store';

type CompanySettingsViewProps = {
  onClose: () => void;
};

export const CompanySettingsView: React.FC<CompanySettingsViewProps> = ({ onClose }) => {
  const companySettings = useAppStore(s => s.companySettings);
  const updateCompanyField = useAppStore(s => s.updateCompanyField);

  const fields: { key: string; icon: typeof Phone; label: string; type: string; placeholder: string }[] = [
    { key: 'name', icon: null, label: 'Company Name', type: 'text', placeholder: 'Enter company name' },
    { key: 'phone', icon: Phone, label: 'Phone', type: 'tel', placeholder: '+7 (495) 123-45-67' },
    { key: 'email', icon: Mail, label: 'Email', type: 'email', placeholder: 'info@company.com' },
    { key: 'address', icon: MapPin, label: 'Address', type: 'text', placeholder: '123 Main St, City' },
    { key: 'website', icon: Globe, label: 'Website', type: 'url', placeholder: 'https://company.com' },
    { key: 'taxId', icon: FileText, label: 'Tax ID (INN)', type: 'text', placeholder: '7701234567' },
  ];

  return (
    <div className="absolute inset-0 z-70 flex flex-col bg-[var(--bg-primary)]/95">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/80">
        <h2 className="text-lg font-bold text-[--text-primary]">Company Settings</h2>
        <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center neu-button">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {fields.map(f => (
          <div key={f.key} className="p-4 rounded-md neu-card-inset">
            <label className="text-xs font-bold uppercase tracking-widest text-[--text-secondary] mb-2 block">
              {f.label}
            </label>
            <div className="flex items-center gap-3">
              {f.icon && (
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-[var(--bg-tertiary)] text-[--text-secondary]">
                  <f.icon size={16} />
                </div>
              )}
              <input
                type={f.type}
                value={(companySettings as any)?.[f.key] || ''}
                onChange={e => updateCompanyField(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="flex-1 text-sm rounded-lg px-3 py-2 neu-input"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

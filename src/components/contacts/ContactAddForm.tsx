import React from 'react';
import { UserPlus, Scan } from 'lucide-react';
import { FormModal } from '../ui/FormModal';
import { FormField } from '../ui/FormField';
import { FormActions } from '../ui/FormActions';
import { useI18n } from '../../lib/i18n';

interface ContactAddFormProps {
  isDark: boolean;
  theme: 'light' | 'dark';
  show: boolean;
  name: string;
  setName: (v: string) => void;
  id: string;
  setId: (v: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onScan: () => void;
  t: (key: string, fallback?: string) => string;
}

export const ContactAddForm = ({ isDark, theme, show, name, setName, id, setId, onClose, onSubmit, onScan, t }: ContactAddFormProps) => {
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && id.trim()) {
      onSubmit(e);
    }
  };

  return (
    <FormModal
      isOpen={show}
      onClose={onClose}
      title={t('contacts.addContact')}
      subtitle={t('contacts.addContactSubtitle')}
      icon={UserPlus}
      theme={theme}
      closeTitle={t('contacts.close')}
    >
      <form onSubmit={handleFormSubmit} className="flex flex-col gap-3 mt-2">
        <FormField
          theme={theme}
          autoFocus
          placeholder={t('contacts.contactName')}
          value={name}
          onChange={setName}
        />
        <FormField
          theme={theme}
          placeholder={t('contacts.networkId')}
          value={id}
          onChange={setId}
          monospace
          icon={Scan}
          iconAction={onScan}
          iconTooltip={t('header.scanQR')}
        />
        <FormActions
          theme={theme}
          submitLabel={t('contacts.saveContact')}
          cancelLabel={t('contacts.close')}
          onSubmit={() => handleFormSubmit({ preventDefault: () => {} } as any)}
          onCancel={onClose}
          disabled={!name.trim() || !id.trim()}
        />
      </form>
    </FormModal>
  );
};

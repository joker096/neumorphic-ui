import { UserRound } from 'lucide-react';

export interface WidgetContact {
  name: string;
  email: string;
  phone: string;
}

type T = (key: string, options?: any) => string;

interface EmbedContactFormProps {
  t: T;
  accent: string;
  contact: WidgetContact;
  onChange: (field: keyof WidgetContact, value: string) => void;
  onSend: () => void;
  sending: boolean;
}

export function EmbedContactForm({
  t,
  accent,
  contact,
  onChange,
  onSend,
  sending,
}: EmbedContactFormProps) {
  return (
    <form
      className="ew-contact"
      onSubmit={(e) => {
        e.preventDefault();
        onSend();
      }}
    >
      <div className="ew-contact-head">
        <UserRound size={14} />
        <span>{t('embed.contactTitle')}</span>
      </div>
      <input
        aria-label={t('embed.contactName')}
        value={contact.name}
        onChange={(e) => onChange('name', e.target.value)}
        placeholder={t('embed.contactName')}
        className="ew-field"
      />
      <input
        aria-label={t('embed.contactEmail')}
        value={contact.email}
        onChange={(e) => onChange('email', e.target.value)}
        placeholder={t('embed.contactEmail')}
        type="email"
        className="ew-field"
      />
      <input
        aria-label={t('embed.contactPhone')}
        value={contact.phone}
        onChange={(e) => onChange('phone', e.target.value)}
        placeholder={t('embed.contactPhone')}
        type="tel"
        className="ew-field"
      />
      <div className="ew-contact-actions">
        <button
          type="submit"
          disabled={sending}
          className="ew-btn-primary"
          style={{ backgroundColor: accent }}
        >
          {t('embed.contactStart')}
        </button>
        <button type="button" onClick={onSend} className="ew-btn-ghost">
          {t('embed.contactSkip')}
        </button>
      </div>
    </form>
  );
}

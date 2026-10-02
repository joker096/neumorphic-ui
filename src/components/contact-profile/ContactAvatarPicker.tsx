import React, { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { CONTACT_FALLBACK_GRADIENT } from "../../constants/contactConstants";
import { ACTIVE_NOW_THRESHOLD_MS } from "../../constants/time";

type Translate = (key: string, options?: any) => string;

interface ContactAvatarSource {
  name: string;
  color?: string;
  online?: boolean;
  lastSeen?: number;
  callInfo?: unknown;
}

interface ContactAvatarPickerProps {
  contact: ContactAvatarSource;
  overrideAvatar?: string;
  ghostViewMode: boolean;
  isDark: boolean;
  t: Translate;
  onSetAvatar: (name: string, dataUrl: string) => void;
  onRemoveAvatar: (name: string) => void;
}

/** Whole-avatar button opening the photo menu (Telegram pattern) plus the presence dot. */
export function ContactAvatarPicker({ contact, overrideAvatar, ghostViewMode, isDark, t, onSetAvatar, onRemoveAvatar }: ContactAvatarPickerProps) {
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => onSetAvatar(contact.name, reader.result as string);
      reader.readAsDataURL(file);
    }
    if (e.target.value) e.target.value = "";
  };

  return (
    <>
      <div className="relative mt-4">
        <button
          type="button"
          onClick={() => setPhotoMenuOpen(o => !o)}
          aria-haspopup="menu"
          aria-expanded={photoMenuOpen}
          aria-label={overrideAvatar ? t('contacts.changePhoto') : t('contacts.setPhoto')}
          title={overrideAvatar ? t('contacts.changePhoto') : t('contacts.setPhoto')}
          className={`group relative w-20 h-20 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br ${contact.color || CONTACT_FALLBACK_GRADIENT} text-[var(--text-primary)] font-bold text-[32px] shadow-lg`}
        >
          {overrideAvatar ? (
            <img src={overrideAvatar} alt="" role="presentation" className="w-full h-full object-cover" loading="lazy" decoding="async" />
          ) : (
            String(contact.name || '').charAt(0)
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
            <Camera size={18} aria-hidden="true" />
          </span>
        </button>
        {!ghostViewMode && (contact.online || contact.lastSeen !== undefined) && !contact.callInfo && (
          <div className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-[3px] ${isDark ? "border-[var(--bg-tertiary)]" : "border-[var(--border-color)]"} ${(contact.online || (contact.lastSeen! > 0 && contact.lastSeen! < ACTIVE_NOW_THRESHOLD_MS)) ? "bg-green-500" : "bg-gray-400"}`} />
        )}
        {photoMenuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setPhotoMenuOpen(false)} aria-hidden="true" />
            <div
              role="menu"
              className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 z-20 rounded-xl shadow-lg border p-1.5 min-w-[200px] ${isDark ? "bg-[var(--bg-tertiary)] border-[var(--border-color)]" : "bg-white border-[var(--border-color)]"}`}
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => { setPhotoMenuOpen(false); fileInputRef.current?.click(); }}
                className="w-full min-h-11 px-3 rounded-lg flex items-center gap-2 text-sm text-left hover:bg-[var(--list-item-hover-bg)] transition-colors"
              >
                <Camera size={16} aria-hidden="true" />
                {overrideAvatar ? t('contacts.changePhoto') : t('contacts.setPhoto')}
              </button>
              {overrideAvatar && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { setPhotoMenuOpen(false); onRemoveAvatar(contact.name); }}
                  className="w-full min-h-11 px-3 rounded-lg flex items-center gap-2 text-sm text-left text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={16} aria-hidden="true" />
                  {t('contacts.removePhoto')}
                </button>
              )}
            </div>
          </>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarFileChange}
      />
      <p className="text-[11px] text-[var(--text-tertiary)] text-center mt-1.5 max-w-[220px]">
        {t('contacts.profilePhotoNote')}
      </p>
    </>
  );
}

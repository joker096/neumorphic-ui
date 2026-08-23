const STORAGE_KEY = 'mess_contact_avatars_v1';

const loadContactAvatars = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Record<string, string>;
  } catch {
    /* ignore */
  }
  return {};
};

const persistContactAvatars = (map: Record<string, string>): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota / privacy errors */
  }
};

export interface ContactAvatarSlice {
  /** Local-only avatar overrides keyed by contact display name. Only visible to you. */
  contactAvatars: Record<string, string>;
  setContactAvatar: (name: string, dataUrl: string) => void;
  removeContactAvatar: (name: string) => void;
}

export const createContactAvatarSlice = (set: any, get: any): ContactAvatarSlice => ({
  contactAvatars: loadContactAvatars(),
  setContactAvatar: (name, dataUrl) => {
    const next = { ...get().contactAvatars, [name]: dataUrl };
    set({ contactAvatars: next });
    persistContactAvatars(next);
  },
  removeContactAvatar: (name) => {
    const next = { ...get().contactAvatars };
    delete next[name];
    set({ contactAvatars: next });
    persistContactAvatars(next);
  },
});

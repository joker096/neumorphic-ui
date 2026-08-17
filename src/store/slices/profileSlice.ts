const savedUserProfile = (() => {
  try {
    const raw = localStorage.getItem('mess_user_profile');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
})();

function ensureProfileId(existing?: { id?: string }): string {
  if (existing?.id) return existing.id;
  try {
    return localStorage.getItem('mess_user_id') || (() => {
      const generated = crypto.randomUUID();
      localStorage.setItem('mess_user_id', generated);
      return generated;
    })();
  } catch {
    return crypto.randomUUID();
  }
}

export interface ProfileSlice {
  userProfile: {
    id: string;
    name: string;
    bio: string;
    avatar: string;
    avatarColor?: string;
    fields: any[];
    status: string;
  };
  setUserProfile: (profile: Partial<{
    id?: string;
    name: string;
    bio: string;
    avatar: string;
    avatarColor?: string;
    fields: any[];
    status: string;
  }>) => void;
}

export const createProfileSlice = (set: any, get: any): ProfileSlice => ({
  userProfile: savedUserProfile
    ? { ...savedUserProfile, id: ensureProfileId(savedUserProfile), status: savedUserProfile.status ?? '' }
    : { id: ensureProfileId(), name: 'User', bio: '', avatar: '', fields: [], status: '' },
  setUserProfile: (profile) => {
    set((state: any) => ({
      userProfile: { ...state.userProfile, ...profile }
    }));
    try {
      const current = get().userProfile;
      localStorage.setItem('mess_user_profile', JSON.stringify(current));
    } catch {}
  },
});

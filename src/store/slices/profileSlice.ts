const savedUserProfile = (() => {
  try {
    const raw = localStorage.getItem('mess_user_profile');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
})();

export interface ProfileSlice {
  userProfile: {
    name: string;
    bio: string;
    avatar: string;
    fields: any[];
    status: string;
  };
  setUserProfile: (profile: Partial<{
    name: string;
    bio: string;
    avatar: string;
    fields: any[];
    status: string;
  }>) => void;
}

export const createProfileSlice = (set: any, get: any): ProfileSlice => ({
  userProfile: savedUserProfile ? { ...savedUserProfile, status: savedUserProfile.status ?? '' } : { name: 'User', bio: '', avatar: '', fields: [], status: '' },
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

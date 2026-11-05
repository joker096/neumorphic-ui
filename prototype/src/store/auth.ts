import { create } from 'zustand';
import { contacts, currentUser } from '../data/mock';

export interface ProfileDraft {
  fullName: string;
  nickname: string;
  dob: string;
  email: string;
  about: string;
  avatar?: string;
}

interface AuthState {
  phone: string;
  remember: boolean;
  otp: string;
  profile: ProfileDraft;
  pin: string;
  fingerprintEnabled: boolean;
  setPhone: (phone: string) => void;
  setRemember: (remember: boolean) => void;
  setOtp: (otp: string) => void;
  updateProfile: (patch: Partial<ProfileDraft>) => void;
  setPin: (pin: string) => void;
  setFingerprintEnabled: (enabled: boolean) => void;
  reset: () => void;
}

/** Candidate photos used by the "tap the avatar" interaction on Fill Profile. */
export const profilePhotoOptions: string[] = [
  currentUser.avatar ?? '',
  contacts[0]?.avatar ?? '',
  contacts[3]?.avatar ?? '',
].filter(Boolean);

const emptyProfile = (): ProfileDraft => ({
  fullName: '',
  nickname: '',
  dob: '',
  email: '',
  about: '',
  avatar: undefined,
});

export const useAuthStore = create<AuthState>((set) => ({
  phone: '',
  remember: false,
  otp: '',
  profile: emptyProfile(),
  pin: '',
  fingerprintEnabled: false,
  setPhone: (phone) => set({ phone }),
  setRemember: (remember) => set({ remember }),
  setOtp: (otp) => set({ otp }),
  updateProfile: (patch) => set((state) => ({ profile: { ...state.profile, ...patch } })),
  setPin: (pin) => set({ pin }),
  setFingerprintEnabled: (fingerprintEnabled) => set({ fingerprintEnabled }),
  reset: () =>
    set({
      phone: '',
      remember: false,
      otp: '',
      profile: emptyProfile(),
      pin: '',
      fingerprintEnabled: false,
    }),
}));

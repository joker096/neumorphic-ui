/**
 * Company section UI constants.
 *
 * Centralizes hardcoded gradients, fallback strings and shared config used by
 * the Company contacts views so components stay free of magic values.
 */

export const MEMBER_AVATAR_GRADIENTS = [
  'from-indigo-400 to-purple-500',
  'from-pink-400 to-rose-500',
  'from-yellow-400 to-orange-500',
  'from-teal-400 to-cyan-500',
] as const;

export const COMPANY_INFO_GRADIENT = 'from-purple-500 to-indigo-600';

export const CHANNEL_GRADIENTS: Record<string, string> = {
  'company-all': 'from-blue-400 to-indigo-500',
  'company-dev': 'from-purple-400 to-purple-600',
};

export const DEFAULT_CHANNEL_GRADIENT = 'from-teal-400 to-cyan-500';

export const CHANNEL_CLICK_GRADIENT = 'from-blue-400 to-indigo-500';

/**
 * Fallback UI copy used when an i18n key has no translation.
 * Mirrors the keys requested via useI18n().t(...) in the Company views.
 */
export const COMPANY_UI_FALLBACKS = {
  orgName: 'Organization',
  teamMembers: 'Team Members',
  channels: 'Company Channels',
  connected: 'Connected',
  scanQR: 'Scan QR to Join',
  scanDescription: 'Point camera at company QR code',
  invite: 'Invite Members',
  inviteDescription: 'Share this QR code with team members',
  emptyMembers: 'No members yet',
  loadError: 'Failed to load members',
  retry: 'Retry',
} as const;

export const COMPANY_MODAL_MAX_WIDTH = 'max-w-[340px] md:max-w-[400px] lg:max-w-[440px]';

/**
 * Fallback UI copy for member role / office labels used by MemberItem.
 * Mirrors the i18n keys requested via t('company.roleAdmin') etc.
 */
export const COMPANY_MEMBER_FALLBACKS = {
  roleAdmin: 'Admin',
  roleMember: 'Member',
  officeMoscow: 'Moscow',
  officeLondon: 'London',
  call: 'Call',
  videoCall: 'Video call',
} as const;

/**
 * Returns a deterministic avatar gradient for a member at the given index.
 */
export const memberColorAt = (index: number): string =>
  MEMBER_AVATAR_GRADIENTS[index % MEMBER_AVATAR_GRADIENTS.length];

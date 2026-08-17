export const CONTACT_GRADIENTS = [
  'from-teal-400 to-emerald-500',
  'from-pink-400 to-rose-500',
  'from-yellow-400 to-orange-500',
] as const;

export const CONTACT_FALLBACK_GRADIENT = 'from-gray-500 to-gray-600';

export const CONTACT_MAX_DAYS = 365;

export const SWIPE_ACTION_COLORS = {
  callLight: '#47557a',
  callDark: '#2b2f42',
  video: '#2563de',
} as const;

export function pickContactGradient(index: number): string {
  return CONTACT_GRADIENTS[index % CONTACT_GRADIENTS.length];
}

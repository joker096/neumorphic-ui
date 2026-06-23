import type { Contact } from '../types/contact';
import { callRecorderService } from '../lib/callRecorderService';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';

export const MAX_CAMPAIGNS_PER_WORKSPACE = 5;
const RATE_LIMIT_MINUTES = 60;
const RATE_WINDOW_MS = RATE_LIMIT_MINUTES * 60 * 1000;

const rateLimit = new Map<string, number>();
const sessions = new Map<string, { debugId?: string; createdAt: number }>();

let rateLimitNotificationShownAt = 0;

export function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const last = rateLimit.get(userId) || 0;
  if (now - last < RATE_WINDOW_MS) {
    const waitMin = Math.ceil((RATE_WINDOW_MS - (now - last)) / 60000);
    if (now - rateLimitNotificationShownAt > RATE_WINDOW_MS) {
      rateLimitNotificationShownAt = now;
      toast.error('Campaign rate limit reached', {
        description: `Please wait ${waitMin} minutes before creating another campaign.`,
      });
    }
    return false;
  }
  return true;
}

export function applyRateLimit(userId: string): void {
  rateLimit.set(userId, Date.now());
}

export function registerRiskSession(contactId: string, debugId?: string) {
  if (!debugId) return;
  const existing = sessions.get(contactId);
  if (existing && existing.debugId === debugId) {
    throw new Error('duplicate_debug_session');
  }
  sessions.set(contactId, { debugId, createdAt: Date.now() });
}

export function getLastActionDebugId(contactId: string): string | undefined {
  const session = sessions.get(contactId);
  return session?.debugId;
}

export function listRiskSessions() {
  return Array.from(sessions.entries()).map(([contactId, value]) => ({
    contactId,
    debugId: value.debugId,
    createdAt: value.createdAt,
  }));
}

export async function startRecordingForCampaign(campaignId: string) {
  const recordingId = `rec-${campaignId}-${nanoid(6)}`;
  await callRecorderService.startRecording(recordingId, new MediaStream(), false);
  return recordingId;
}

export function getParticipantsForChannel(channelId: string, contacts: Contact[]) {
  return contacts.filter((c) => c.channelId === channelId || c.channelIds?.includes(channelId));
}

export function totalProfileShares(channelId: string, contacts: Contact[]) {
  return getParticipantsForChannel(channelId, contacts).length;
}

export function adminPauseState(channelId: string, contacts: Contact[]) {
  const participants = getParticipantsForChannel(channelId, contacts);
  return { paused: false, pausedBy: null, targetContactId: null };
}

export function retryProfileShare(
  contactId: string,
  contacts: Contact[],
  onUpdate: (contact: Contact) => void,
) {
  const contact = contacts.find((c) => c.id === contactId);
  if (!contact) return;
  const updated: Contact = {
    ...contact,
    profileShare: contact.profileShare && typeof contact.profileShare === 'object' 
      ? { ...contact.profileShare, state: 'sending', updatedAt: Date.now() } 
      : { state: 'sending', updatedAt: Date.now() },
  };
  onUpdate(updated);
}

export function clearCampaignState(contactId: string, contacts: Contact[], onUpdate: (contact: Contact) => void) {
  const contact = contacts.find((c) => c.id === contactId);
  if (!contact) return;
  const updated: Contact = {
    ...contact,
    profileShare: undefined,
  };
  onUpdate(updated);
}

export function canApplyCampaign(contact: Contact) {
  const state = contact.profileShare && typeof contact.profileShare === 'object' ? contact.profileShare.state : undefined;
  if (state === 'sent') return true;
  if (state === 'sending') return false;
  if (state === 'review_needed') return false;
  if (state === 'failed') return true;
  return true;
}

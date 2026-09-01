// App-level URL configuration.
// Centralized so public surface URLs can't drift across features.

const ENV_APP_URL = (import.meta.env.VITE_APP_URL as string | undefined) || '';

// Main app home (also used by the CRM invite QR → short presentable host).
export const APP_HOME_URL = (ENV_APP_URL || 'https://mess.cvr.name').replace(/\/+$/, '');

// Public messenger domain used for channel invite links and the embed widget.
export const MESSENGER_WEB_BASE = 'https://messanger.app';

// URL-shortener base for group invites.
export const INVITE_SHORT_BASE = 'https://ma.to';

export const EMBED_WIDGET_URL = `${MESSENGER_WEB_BASE}/embed.js`;

export function channelInviteLink(username: string | undefined, chatId: string): string {
  const name = typeof username === 'string' && username ? `@${username}` : chatId;
  return `${MESSENGER_WEB_BASE}/channel/${name}`;
}

export function groupInviteUrl(token: string): string {
  return `${INVITE_SHORT_BASE}/${token}`;
}
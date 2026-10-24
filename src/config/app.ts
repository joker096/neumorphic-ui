// App-level sharing configuration. Links identify content; they never point at
// a hosted messenger instance. The receiving native client owns `nexus://`.
const NEXUS_SCHEME = 'nexus://';

// Embeds are opt-in: an operator may self-host a widget and explicitly set this
// build-time value. There is intentionally no public default.
// Guarded against non-Vite runtimes (e.g. Playwright specs importing token libs).
const __env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
export const EMBED_WIDGET_URL = typeof __env?.VITE_EMBED_WIDGET_URL === 'string' ? __env.VITE_EMBED_WIDGET_URL.trim() : '';

export function channelInviteLink(username: string | undefined, chatId: string): string {
  const name = typeof username === 'string' && username ? `@${username}` : chatId;
  return `${NEXUS_SCHEME}channel/${encodeURIComponent(name)}`;
}

export function groupInviteUrl(token: string): string {
  return `${NEXUS_SCHEME}group/invite/${encodeURIComponent(token)}`;
}

export function crmInviteLink(code: string): string {
  return `${NEXUS_SCHEME}company/invite/${encodeURIComponent(code)}`;
}

// Deep link that opens the story viewer in a client that registered `nexus://`.
export function storyShareLink(userId: number | string, storyId: number | string): string {
  return `${NEXUS_SCHEME}story/${encodeURIComponent(userId)}/${encodeURIComponent(storyId)}`;
}

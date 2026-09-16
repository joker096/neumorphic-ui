// App-level sharing configuration. Links identify content; they never point at
// a hosted messenger instance. The receiving native client owns `nexus://`.
const NEXUS_SCHEME = 'nexus://';

// Embeds are opt-in: an operator may self-host a widget and explicitly set this
// build-time value. There is intentionally no public default.
export const EMBED_WIDGET_URL = (import.meta.env.VITE_EMBED_WIDGET_URL as string | undefined)?.trim() || '';

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

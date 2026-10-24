/**
 * Live inbox for a standalone site chat: subscribes to the relay topic
 * `company:<ns>:channel:<id>` (the same topic the EmbedWidget publishes to),
 * decrypts sealed visitor frames with the locally stored channel secret, and
 * routes them into the personal site-chat store — typed contact envelopes go
 * to the website-contacts list, plain messages go to the per-site conversation.
 *
 * It also exposes `reply(text)`, the operator side of the two-way chat: a reply
 * is sealed to the visitor's ephemeral public key (the one that sent the most
 * recent message) and published back to the same topic, so the visitor's widget
 * decrypts and renders it. This is what makes the embed an actual conversation
 * rather than a one-way contact form.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { RelayClient } from '../lib/company/relayClient';
import type { RelayStatus } from '../lib/company/relaySocket';
import { openFromChannel, sealToGuest } from '../lib/embed/embedCrypto';
import { usePersonalSiteChatStore } from '../store/personalSiteChat';

/** Normalize a page URL (or raw string) to a bare hostname. */
function domainFromPageUrl(url?: string): string {
  if (!url) return '';
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return url.toLowerCase().replace(/^https?:\/\//, '').split('/')[0].split('?')[0];
  }
}

export function usePersonalSiteChatInbox(siteChatId: string | null): {
  status: RelayStatus;
  reply: (text: string) => Promise<boolean>;
} {
  const ns = usePersonalSiteChatStore((s) => s.ns);
  const secret = usePersonalSiteChatStore((s) =>
    siteChatId ? s.channelKeys[siteChatId]?.secretKeyB64 : undefined,
  );
  const ingestContact = usePersonalSiteChatStore((s) => s.ingestContact);
  const appendMessage = usePersonalSiteChatStore((s) => s.appendMessage);
  const rememberGuest = usePersonalSiteChatStore((s) => s.rememberGuest);
  const [status, setStatus] = useState<RelayStatus>('connecting');
  const clientRef = useRef<RelayClient | null>(null);

  useEffect(() => {
    if (!siteChatId || !ns || !secret) return;
    const client = new RelayClient(`company:${ns}:channel:${siteChatId}`);
    clientRef.current = client;
    client.onStatus(setStatus);
    client.onMessage(async (payload: any) => {
      try {
        const text = await openFromChannel(secret, payload);
        let parsed: any = null;
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = null;
        }
        if (parsed && parsed.v === 1 && parsed.kind === 'contact') {
          ingestContact({
            siteChatId,
            domain: domainFromPageUrl(parsed.pageUrl) || parsed.pageTitle || 'unknown',
            name: parsed.name || '',
            email: parsed.email,
            phone: parsed.phone,
            pageUrl: parsed.pageUrl,
            referrer: parsed.referrer,
            ts: parsed.ts,
          });
        } else {
          // Plain visitor message — remember their ephemeral key so replies can
          // be addressed back to this exact visitor.
          if (payload && payload.senderPubKey) rememberGuest(siteChatId, payload.senderPubKey);
          appendMessage(siteChatId, { text, from: 'visitor' });
        }
      } catch {
        /* undecryptable frame — ignore */
      }
    });
    client.start();
    return () => {
      clientRef.current = null;
      client.stop();
    };
  }, [siteChatId, ns, secret, ingestContact, appendMessage, rememberGuest]);

  const reply = useCallback(
    async (text: string): Promise<boolean> => {
      const trimmed = text.trim();
      if (!trimmed || !siteChatId) return false;
      const st = usePersonalSiteChatStore.getState();
      const kp = st.channelKeys[siteChatId];
      const guestPub = st.lastGuestKeys[siteChatId];
      const client = clientRef.current;
      if (!kp || !guestPub || !client) return false;
      try {
        const sealed = await sealToGuest(kp, guestPub, trimmed);
        // Delivery proof: a dropped frame (relay down) must not become a fake
        // "sent" bubble — the reply is simply not appended.
        if (!client.publish(sealed)) return false;
        st.appendMessage(siteChatId, { text: trimmed, from: 'me' });
        return true;
      } catch {
        return false;
      }
    },
    [siteChatId],
  );

  return { status, reply };
}

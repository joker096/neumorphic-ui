import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../store";
import { SIGNALING_SEED_URLS, IS_RELAY_PROXY_CONFIGURED } from "../config/signalling";
import { p2pNetwork } from "../lib/p2p/network";
import { SignallingManager } from "../lib/signaling/manager";
import type { TunnelBackend } from "../lib/transport/wsTunnel";

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'blocked' | 'error';

/** Register the persistent identity key on the main signaling WS so inbound
 * dial-backs (M021) can reach us while idle. First bind → `registered`; if the
 * key is already held (e.g. our own transport or another tab) the server sends
 * an ownership challenge we answer by signing the nonce. Best-effort: a
 * registration failure must never break the plain connection. */
const registerMainIdentity = async (mgr: SignallingManager): Promise<void> => {
  try {
    const { hasMasterIdentity, getMasterKeySet } = await import('../lib/identity/masterKey');
    if (!(await hasMasterIdentity())) return;
    const identity = await getMasterKeySet();
    const { buf2hex } = await import('../lib/crypto/cryptoCore');
    const pubHex = buf2hex(identity.ed25519Public);

    const waitFor = (types: string[], send: () => void, timeoutMs = 10000): Promise<any | null> =>
      new Promise((resolve) => {
        const timer = setTimeout(() => {
          off();
          resolve(null);
        }, timeoutMs);
        const off = mgr.onMessage((msg) => {
          if (msg && typeof msg === 'object' && types.includes(msg.type)) {
            off();
            clearTimeout(timer);
            resolve(msg);
          }
        });
        send();
      });

    const first = await waitFor(['challenge', 'registered', 'error'], () =>
      mgr.send({ type: 'register', publicKey: pubHex }),
    );
    if (!first || first.type === 'registered' || first.type === 'error' || !first.nonce) return;
    const { signDh } = await import('../lib/p2p/identityPin');
    await waitFor(['registered', 'error'], () =>
      mgr.send({
        type: 'register-challenge',
        publicKey: pubHex,
        nonce: first.nonce,
        signature: signDh(identity.ed25519Secret, first.nonce),
      }),
    );
  } catch {
    /* registration is best-effort; anonymous operation continues */
  }
};

export const useAppConnection = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionState>('disconnected');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [regionBlocked, setRegionBlocked] = useState(false);
  const managerRef = useRef<SignallingManager | null>(null);
  const relayBackend = useAppStore(state => state.relayBackend);
  const autoReconnect = useAppStore(state => state.autoReconnect);

  useEffect(() => {
    // Seeds resolve to env URLs, else the page origin (`/ws`). An empty list
    // means a non-DOM context (SSR/Node) with no origin — treat as serverless.
    if (SIGNALING_SEED_URLS.length === 0) {
      setConnectionStatus('disconnected');
      setConnectionError(null);
      useAppStore.getState().setConnectionStatus('disconnected');
      useAppStore.getState().setBlockedBackends([]);
      return;
    }

    // A relay backend only has somewhere to dial when this build carries a
    // relay-proxy endpoint. Otherwise a stale persisted selection would claim
    // "Relay" in the status pill while the socket still goes to the origin.
    const savedBackend: TunnelBackend = IS_RELAY_PROXY_CONFIGURED
      ? ((relayBackend as TunnelBackend) || 'direct')
      : 'direct';
    const mgr = new SignallingManager(SIGNALING_SEED_URLS, savedBackend, autoReconnect);
    managerRef.current = mgr;

    setConnectionStatus('connecting');
    setConnectionError(null);
    useAppStore.getState().setConnectionStatus('connecting');
    useAppStore.getState().setTransportBackend(mgr.getBackend());
    useAppStore.getState().setLatency(mgr.getLatency());

    mgr.connect().catch(() => {
      setConnectionStatus('error');
      setConnectionError(mgr.getLastError());
      useAppStore.getState().setConnectionStatus('error');
      useAppStore.getState().setBlockedBackends(['all']);
    });

    // Inbound dial-back: an offer targeted at our identity key arrives on the
    // main WS (we are idle — no transport exists yet). Dial back with a
    // dedicated transport and answer it. Duplicate offers are deduped inside
    // the network layer.
    mgr.connect().then(() => {
      mgr.onMessage((msg) => {
        if (msg && typeof msg === 'object' && msg.type === 'offer' && typeof msg.from === 'string') {
          void p2pNetwork.acceptInboundOffer(msg.from, msg);
        }
      });
      void registerMainIdentity(mgr);
    });

    const unsub1 = mgr.onStateChange((state) => {
      const s = state as ConnectionState;
      setConnectionStatus(s);
      if (s === 'connected') setConnectionError(null);
      else if (s === 'blocked' || s === 'error') setConnectionError(mgr.getLastError());
      useAppStore.getState().setConnectionStatus(s);
      useAppStore.getState().setTransportBackend(mgr.getBackend());
      useAppStore.getState().setLatency(mgr.getLatency());
      if (s === 'blocked' || s === 'error') {
        useAppStore.getState().setBlockedBackends(['all']);
      }
    });

    const unsub2 = mgr.onBlockedRegion(() => {
      setRegionBlocked(true);
      useAppStore.getState().setRegionBlocked(true);
    });

    const handleOnline = () => {
      setConnectionStatus('connecting');
      setConnectionError(null);
      useAppStore.getState().setConnectionStatus('connecting');
      useAppStore.getState().setRegionBlocked(false);
      mgr.getPool().reset();
      mgr.connect().catch(() => {
        setConnectionStatus('error');
        setConnectionError(mgr.getLastError());
        useAppStore.getState().setConnectionStatus('error');
      });
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
      mgr.disconnect();
      unsub1();
      unsub2();
    };
  }, [relayBackend, autoReconnect]);

  return { connectionStatus, connectionError, regionBlocked, managerRef };
};

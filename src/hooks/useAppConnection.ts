import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../store";
import { SIGNALING_SEED_URLS } from "../config/signalling";
import { SignallingManager } from "../lib/signaling/manager";
import type { TunnelBackend } from "../lib/transport/wsTunnel";

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'blocked' | 'error';

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

    const savedBackend = (relayBackend as TunnelBackend) || 'direct';
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

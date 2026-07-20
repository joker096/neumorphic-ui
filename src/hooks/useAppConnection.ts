import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../store";
import { SIGNALING_SEED_URLS } from "../config/signalling";
import { SignallingManager } from "../lib/signaling/manager";
import type { TunnelBackend } from "../lib/transport/wsTunnel";

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'blocked' | 'error';

export const useAppConnection = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionState>('disconnected');
  const [regionBlocked, setRegionBlocked] = useState(false);
  const managerRef = useRef<SignallingManager | null>(null);

  useEffect(() => {
    const savedBackend = (localStorage.getItem('app_relay_backend') || 'direct') as TunnelBackend;
    const mgr = new SignallingManager(SIGNALING_SEED_URLS, savedBackend);
    managerRef.current = mgr;

    setConnectionStatus('connecting');
    useAppStore.getState().setConnectionStatus('connecting');
    useAppStore.getState().setTransportBackend(mgr.getBackend());
    useAppStore.getState().setLatency(mgr.getLatency());

    mgr.connect().catch(() => {
      setConnectionStatus('error');
      useAppStore.getState().setConnectionStatus('error');
      useAppStore.getState().setBlockedBackends(['all']);
    });

    const unsub1 = mgr.onStateChange((state) => {
      const s = state as ConnectionState;
      setConnectionStatus(s);
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

    return () => {
      mgr.disconnect();
      unsub1();
      unsub2();
    };
  }, []);

  return { connectionStatus, regionBlocked, managerRef };
};

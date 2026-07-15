import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../store";
import { SIGNALING_SEED_URLS } from "../config/signalling";
import { SignallingManager } from "../lib/signaling/manager";
import type { TunnelBackend } from "../lib/transport/wsTunnel";

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'blocked' | 'error';

export const useAppConnection = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionState>('disconnected');
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
    });

    const unsub1 = mgr.onStateChange((state) => {
      setConnectionStatus(state);
      useAppStore.getState().setConnectionStatus(state);
      useAppStore.getState().setTransportBackend(mgr.getBackend());
      useAppStore.getState().setLatency(mgr.getLatency());
    });

    const unsub2 = mgr.onBlockedRegion(() => {
      useAppStore.getState().setRegionBlocked(true);
    });

    return () => {
      mgr.disconnect();
      unsub1();
      unsub2();
    };
  }, []);

  return { connectionStatus, managerRef };
};

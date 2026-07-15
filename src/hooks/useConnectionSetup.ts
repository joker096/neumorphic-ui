import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { SignallingManager } from '../lib/signaling/manager';
import type { TunnelBackend } from '../lib/transport/wsTunnel';
import { SIGNALING_SEED_URLS } from '../config/signalling';

export function useConnectionSetup() {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'blocked' | 'error'>('disconnected');
  const [regionBlocked, setRegionBlocked] = useState(false);
  const managerRef = useRef<SignallingManager | null>(null);

  const syncToStore = (mgr: SignallingManager, status: string) => {
    useAppStore.getState().setConnectionStatus(status as any);
    useAppStore.getState().setTransportBackend(mgr.getBackend());
    useAppStore.getState().setLatency(mgr.getLatency());
    if (status === 'blocked' || status === 'error') {
      useAppStore.getState().setBlockedBackends(['all']);
    }
  };

  useEffect(() => {
    const savedBackend = (localStorage.getItem('app_relay_backend') || 'direct') as TunnelBackend;
    const mgr = new SignallingManager(SIGNALING_SEED_URLS, savedBackend);
    managerRef.current = mgr;

    setConnectionStatus('connecting');
    syncToStore(mgr, 'connecting');
    mgr.connect().catch(() => {
      setConnectionStatus('error');
      syncToStore(mgr, 'error');
    });

    const unsub1 = mgr.onStateChange((state) => {
      setConnectionStatus(state);
      syncToStore(mgr, state);
    });

    const unsub2 = mgr.onBlockedRegion((event) => {
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
}

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { SignallingManager } from '../lib/signaling/manager';
import type { TunnelBackend } from '../lib/transport/wsTunnel';
import { SIGNALING_SEED_URLS } from '../config/signalling';

export function useConnectionSetup() {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'blocked' | 'error'>('disconnected');
  const [regionBlocked, setRegionBlocked] = useState(false);
  const managerRef = useRef<SignallingManager | null>(null);
  const relayBackend = useAppStore(state => state.relayBackend);
  const setConnectionStatusStore = useAppStore(state => state.setConnectionStatus);
  const setTransportBackendStore = useAppStore(state => state.setTransportBackend);
  const setLatencyStore = useAppStore(state => state.setLatency);
  const setBlockedBackendsStore = useAppStore(state => state.setBlockedBackends);
  const setRegionBlockedStore = useAppStore(state => state.setRegionBlocked);
  const autoReconnect = useAppStore(state => state.autoReconnect);

  const syncToStore = (mgr: SignallingManager, status: string) => {
    setConnectionStatusStore(status as any);
    setTransportBackendStore(mgr.getBackend());
    setLatencyStore(mgr.getLatency());
    if (status === 'blocked' || status === 'error') {
      setBlockedBackendsStore(['all']);
    }
  };

  useEffect(() => {
    const savedBackend = (relayBackend as TunnelBackend) || 'direct';
    const mgr = new SignallingManager(SIGNALING_SEED_URLS, savedBackend, autoReconnect);
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
      setRegionBlockedStore(true);
    });

    return () => {
      mgr.disconnect();
      unsub1();
      unsub2();
    };
  }, [relayBackend]);

  return { connectionStatus, regionBlocked, managerRef };
}

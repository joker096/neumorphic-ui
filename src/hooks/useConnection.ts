import { useEffect, useRef, useState } from "react";
import { SignallingManager } from "../lib/signaling/manager";

export const useConnection = () => {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'blocked' | 'error'>('disconnected');
  const [regionBlocked, setRegionBlocked] = useState(false);
  const managerRef = useRef<SignallingManager | null>(null);

  useEffect(() => {
    const seedUrls = [
      'wss://signaling1.messanger.app/ws',
      'wss://signaling2.messanger.app/ws',
      'wss://signaling3.messanger.app/ws',
    ];
    const mgr = new SignallingManager(seedUrls);
    managerRef.current = mgr;

    setConnectionStatus('connecting');
    mgr.connect().catch(() => setConnectionStatus('error'));

    const unsub1 = mgr.onStateChange((state) => {
      setConnectionStatus(state);
    });

    const unsub2 = mgr.onBlockedRegion((event) => {
      setRegionBlocked(true);
    });

    return () => {
      mgr.disconnect();
      unsub1();
      unsub2();
    };
  }, []);

  return { connectionStatus, regionBlocked };
};
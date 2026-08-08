import { useAppStore } from '../../store';

export interface ProxyConfig {
  enabled: boolean
  url: string
  torBridge: string
  obfuscationMode: string
}

export function getProxyConfig(): ProxyConfig {
  const store = useAppStore.getState();
  return {
    enabled: store.proxyEnabled,
    url: store.proxyUrl,
    torBridge: store.torBridge,
    obfuscationMode: store.obfuscationMode,
  }
}

export function applyProxyConfig(config: ProxyConfig): void {
  // No-op for now - placeholder for when proxy is actually connected to WebRTC
}

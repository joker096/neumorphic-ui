export interface ProxyConfig {
  enabled: boolean
  url: string
  torBridge: string
  obfuscationMode: string
}

export function getProxyConfig(): ProxyConfig {
  return {
    enabled: localStorage.getItem("app_proxy") === "true",
    url: localStorage.getItem("app_proxy_url") || "",
    torBridge: localStorage.getItem("app_tor_bridge") || "None",
    obfuscationMode: localStorage.getItem("app_obfuscation") || "Auto",
  }
}

export function applyProxyConfig(config: ProxyConfig): void {
  // No-op for now - placeholder for when proxy is actually connected to WebRTC
}

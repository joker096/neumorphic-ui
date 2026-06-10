// src/lib/network/AnonymityLayer.ts
// Anonymity layer for Mess&Anger - implements Tor/SOCKS5 proxy config,
// relay-only mode, timestamp fuzzing, and metadata killswitches.

import { useAppStore } from '../../store'

export interface AnonymityConfig {
  enabled: boolean
  torBridge: string
  obfuscationMode: 'none' | 'auto' | 'strict'
  relayOnly: boolean
  timestampFuzzing: boolean
  metadataKillswitches: {
    typingIndicators: boolean
    deliveryReceipts: boolean
    onlineStatus: boolean
    readReceipts: boolean
  }
}

export class AnonymityLayer {
  private static config: AnonymityConfig = {
    enabled: false,
    torBridge: '',
    obfuscationMode: 'none',
    relayOnly: false,
    timestampFuzzing: false,
    metadataKillswitches: {
      typingIndicators: true,
      deliveryReceipts: true,
      onlineStatus: true,
      readReceipts: true,
    },
  }

  static configure(config: Partial<AnonymityConfig>): void {
    this.config = { ...this.config, ...config }
    this.saveConfig()
  }

  static isEnabled(): boolean {
    return this.config.enabled
  }

  static getMetadataKillswitches(): AnonymityConfig['metadataKillswitches'] {
    if (this.config.enabled) {
      // When anonymized, force metadata killswitches to true (kill metadata)
      return {
        typingIndicators: true,
        deliveryReceipts: true,
        onlineStatus: true,
        readReceipts: true,
      }
    }
    return this.config.metadataKillswitches
  }

  static isRelayOnly(): boolean {
    return this.config.enabled && this.config.relayOnly
  }

  static getIceServers(): { urls: string; username?: string; credential?: string }[] {
    const servers: { urls: string; username?: string; credential?: string }[] = []
    if (this.isRelayOnly()) {
      servers.push({ urls: 'turn:turn.relay.example.com:3478' })
      servers.push({ urls: 'turns:turn.relay.example.com:3478' })
    }
    return servers
  }

  static fuzzTimestamp(ts: number): number {
    if (!this.config.timestampFuzzing) return ts
    // Add random +/-5min jitter
    const jitter = Math.floor(Math.random() * 600000) - 300000 // +/- 5 min
    return ts + jitter
  }

  static shouldShowTypingIndicator(): boolean {
    const state = useAppStore.getState()
    if (this.config.enabled) return false // kill metadata
    return !state.typingIndicators
  }

  static shouldShowDeliveryReceipt(): boolean {
    const state = useAppStore.getState()
    if (this.config.enabled) return false // kill metadata
    return !state.deliveryReceipts
  }

  static shouldShowOnlineStatus(): boolean {
    const state = useAppStore.getState()
    if (this.config.enabled) return false // kill metadata
    return !state.readReceipts
  }

  static shouldShowReadReceipt(): boolean {
    const state = useAppStore.getState()
    if (this.config.enabled) return false // kill metadata
    return !state.readReceipts
  }

  static shouldSendMetadata(type: 'typing-indicator' | 'delivery-receipt' | 'online-status' | 'read-receipt'): boolean {
    if (!this.config.enabled) return true // anonymity disabled, allow all metadata
    switch (type) {
      case 'typing-indicator':
        return !this.config.metadataKillswitches.typingIndicators
      case 'delivery-receipt':
        return !this.config.metadataKillswitches.deliveryReceipts
      case 'online-status':
        return !this.config.metadataKillswitches.onlineStatus
      case 'read-receipt':
        return !this.config.metadataKillswitches.readReceipts
      default:
        return true
    }
  }

  private static saveConfig(): void {
    try {
      localStorage.setItem('anonymity_config', JSON.stringify(this.config))
    } catch { /* noop */ }
  }

  private static loadConfig(): void {
    try {
      const saved = localStorage.getItem('anonymity_config')
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) }
      }
    } catch { /* noop */ }
  }

  static init(): void {
    this.loadConfig()
  }
}


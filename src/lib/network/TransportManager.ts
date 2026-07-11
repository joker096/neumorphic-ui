// src/lib/network/TransportManager.ts
export type TransportMode = 'webrtc' | 'websocket' | 'mesh' | 'tor'

export interface TransportConfig {
  mode: TransportMode
  urls?: string[]
  torBridge?: string
  relayOnly: boolean
}

export class TransportManager {
  private static currentMode: TransportMode = 'webrtc'
  private static config: TransportConfig = {
    mode: 'webrtc',
    urls: [],
    torBridge: '',
    relayOnly: false,
  }

  static configure(newConfig: Partial<TransportConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.currentMode = newConfig.mode || this.currentMode
  }

  static getMode(): TransportMode {
    return this.currentMode
  }

  static isRelayOnly(): boolean {
    return this.config.relayOnly
  }

  static setRelayOnly(relayOnly: boolean): void {
    this.config.relayOnly = relayOnly
    if (relayOnly && this.currentMode === 'webrtc') {
      this.currentMode = 'mesh'
    }
  }

  static async switchMode(newMode: TransportMode): Promise<void> {
    this.currentMode = newMode
  }

  static getIceServers(): { urls: string; username?: string; credential?: string }[] {
    if (this.config.relayOnly) {
      return [
        { urls: 'turn:turn.relay.example.com:3478' },
        { urls: 'turns:turn.relay.example.com:3478' },
      ]
    }
    return [
      { urls: 'stun:turn.neumorphic.local:3478' },
      { urls: 'turn:turn.relay.example.com:3478' },
    ]
  }

  static getSignalingUrls(): string[] {
    if (this.currentMode === 'tor' && this.config.torBridge) {
      return [this.config.torBridge]
    }
    return this.config.urls || ['wss://signaling.example.com']
  }

  static reset(): void {
    this.currentMode = 'webrtc'
    this.config = {
      mode: 'webrtc',
      urls: [],
      torBridge: '',
      relayOnly: false,
    }
  }
}

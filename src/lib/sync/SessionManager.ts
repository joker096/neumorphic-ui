import * as idb from 'idb-keyval';

const SESSION_STORE = 'mess-anger-sessions';
const MAX_SESSIONS = 50;

export interface ManagedSession {
  id: string;
  deviceId: string;
  deviceName: string;
  platform: string;
  startedAt: number;
  lastActive: number;
  isActive: boolean;
  ip?: string;
  location?: string;
}

export class SessionManager {
  private currentDeviceId: string;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor(deviceId: string) {
    this.currentDeviceId = deviceId;
  }

  async loadSessions(): Promise<ManagedSession[]> {
    try {
      const stored = await idb.get(SESSION_STORE);
      return Array.isArray(stored) ? stored : [];
    } catch { return []; }
  }

  async registerSession(): Promise<ManagedSession> {
    const sessions = await this.loadSessions();
    const existing = sessions.find(s => s.deviceId === this.currentDeviceId);

    const session: ManagedSession = existing || {
      id: crypto.randomUUID(),
      deviceId: this.currentDeviceId,
      deviceName: this.getDeviceName(),
      platform: navigator.platform || 'web',
      startedAt: Date.now(),
      lastActive: Date.now(),
      isActive: true,
    };

    if (!existing) {
      sessions.push(session);
      if (sessions.length > MAX_SESSIONS) {
        sessions.sort((a, b) => b.lastActive - a.lastActive);
        sessions.splice(MAX_SESSIONS);
      }
    } else {
      existing.lastActive = Date.now();
    }

    await idb.set(SESSION_STORE, sessions);
    this.startHeartbeat();
    return session;
  }

  async endSession() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    const sessions = await this.loadSessions();
    const idx = sessions.findIndex(s => s.deviceId === this.currentDeviceId);
    if (idx >= 0) {
      sessions[idx].isActive = false;
      await idb.set(SESSION_STORE, sessions);
    }
  }

  async remoteTerminate(deviceId: string): Promise<boolean> {
    const sessions = await this.loadSessions();
    const idx = sessions.findIndex(s => s.deviceId === deviceId);
    if (idx >= 0) {
      sessions[idx].isActive = false;
      await idb.set(SESSION_STORE, sessions);
      return true;
    }
    return false;
  }

  async getActiveSessions(): Promise<ManagedSession[]> {
    const sessions = await this.loadSessions();
    return sessions.filter(s => s.isActive);
  }

  async cleanupStaleSessions(maxAgeMs = 90 * 24 * 60 * 60 * 1000) {
    const sessions = await this.loadSessions();
    const cutoff = Date.now() - maxAgeMs;
    const filtered = sessions.filter(s => s.lastActive > cutoff);
    if (filtered.length !== sessions.length) {
      await idb.set(SESSION_STORE, filtered);
    }
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(async () => {
      const sessions = await this.loadSessions();
      const session = sessions.find(s => s.deviceId === this.currentDeviceId);
      if (session) {
        session.lastActive = Date.now();
        await idb.set(SESSION_STORE, sessions);
      }
    }, 60000);
  }

  private getDeviceName(): string {
    const ua = navigator.userAgent;
    if (ua.includes('iPhone')) return 'iPhone';
    if (ua.includes('iPad')) return 'iPad';
    if (ua.includes('Mac')) return 'Mac';
    if (ua.includes('Windows')) return 'Windows PC';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    return 'Unknown Device';
  }
}

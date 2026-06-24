type PoolConnection = 'primary' | 'standby';
type ConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

export class ConnectionPool {
  private primary: WebSocket | null = null;
  private standby: WebSocket | null = null;
  private states: Record<PoolConnection, ConnectionState> = {
    primary: 'idle',
    standby: 'idle',
  };
  private onFailover?: () => void;

  getPrimary(): WebSocket | null { return this.primary; }
  getStandby(): WebSocket | null { return this.standby; }
  getState(conn: PoolConnection): ConnectionState { return this.states[conn]; }

  setState(conn: PoolConnection, state: ConnectionState): void {
    this.states[conn] = state;
  }

  setPrimary(ws: WebSocket | null): void {
    this.primary = ws;
    this.states.primary = ws ? 'connected' : 'idle';
  }

  setStandby(ws: WebSocket | null): void {
    this.standby = ws;
    this.states.standby = ws ? 'connected' : 'idle';
  }

  async failover(): Promise<boolean> {
    if (this.states.standby === 'connected' && this.standby) {
      this.primary?.close();
      this.primary = this.standby;
      this.states.primary = 'connected';
      this.standby = null;
      this.states.standby = 'idle';
      if (this.onFailover) this.onFailover();
      return true;
    }
    return false;
  }

  onFailoverCallback(cb: () => void): void {
    this.onFailover = cb;
  }

  closeAll(): void {
    this.primary?.close();
    this.standby?.close();
    this.primary = null;
    this.standby = null;
    this.states = { primary: 'idle', standby: 'idle' };
  }
}

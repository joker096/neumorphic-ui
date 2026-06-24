interface ObfuscatorConfig {
  mode: 'xorshroud' | 'httpmask' | 'mediadummy';
  userAgentPool?: string[];
}

const DEFAULT_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/119.0.0.0 Safari/537.36',
];

const HTTP_POOL = {
  userAgents: DEFAULT_USER_AGENTS,
  accepts: ['text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'],
  acceptLanguages: ['en-US,en;q=0.9', 'ru-RU,ru;q=0.9,en;q=0.8', 'de-DE,de;q=0.9,en;q=0.8'],
};

export class TrafficObfuscator {
  private key: string;
  private config: ObfuscatorConfig;

  constructor(key: string = crypto.randomUUID(), mode: ObfuscatorConfig['mode'] = 'xorshroud') {
    this.key = key;
    this.config = { mode, userAgentPool: DEFAULT_USER_AGENTS };
  }

  setMode(mode: ObfuscatorConfig['mode']): void {
    this.config.mode = mode;
  }

  obfuscate(data: string): string {
    if (!data) return '';
    switch (this.config.mode) {
      case 'httpmask': return this.httpWrap(data);
      case 'mediadummy': return this.mediaDummyWrap(data);
      default: return this.xorShroud(data);
    }
  }

  deobfuscate(data: string): string {
    if (!data) return '';
    switch (this.config.mode) {
      case 'httpmask': return this.httpUnwrap(data);
      case 'mediadummy': return this.mediaDummyUnwrap(data);
      default: return this.xorUnshroud(data);
    }
  }

  private xorShroud(data: string): string {
    const encoded = btoa(data);
    let result = '';
    for (let i = 0; i < encoded.length; i++) {
      result += String.fromCharCode(encoded.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length));
    }
    return result;
  }

  private xorUnshroud(data: string): string {
    try {
      let decoded = '';
      for (let i = 0; i < data.length; i++) {
        decoded += String.fromCharCode(data.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length));
      }
      return atob(decoded);
    } catch {
      return '';
    }
  }

  private httpWrap(data: string): string {
    const ua = HTTP_POOL.userAgents[Math.floor(Math.random() * HTTP_POOL.userAgents.length)];
    const accept = HTTP_POOL.accepts[Math.floor(Math.random() * HTTP_POOL.accepts.length)];
    const lang = HTTP_POOL.acceptLanguages[Math.floor(Math.random() * HTTP_POOL.acceptLanguages.length)];
    const encoded = btoa(data);
    const padding = Math.floor(Math.random() * 128);
    const body = encoded + 'x'.repeat(padding);
    return [
      'HTTP/1.1 200 OK',
      `Content-Type: text/plain; charset=utf-8`,
      `Content-Length: ${body.length}`,
      `User-Agent: ${ua}`,
      `Accept: ${accept}`,
      `Accept-Language: ${lang}`,
      'Cache-Control: no-cache',
      'Connection: keep-alive',
      '',
      body,
    ].join('\r\n');
  }

  private httpUnwrap(data: string): string {
    try {
      const parts = data.split('\r\n\r\n');
      if (parts.length < 2) return this.xorUnshroud(data);
      const body = parts.slice(1).join('\r\n\r\n');
      const trimmed = body.replace(/x+$/, '');
      return atob(trimmed);
    } catch {
      return '';
    }
  }

  private mediaDummyWrap(data: string): string {
    const encoded = btoa(data);
    const rtpHeader = new Uint8Array(12);
    rtpHeader[0] = 0x80;
    rtpHeader[1] = 0x60 | (Math.floor(Math.random() * 16) + 96);
    rtpHeader[2] = 0;
    rtpHeader[3] = Math.floor(Math.random() * 255);
    rtpHeader.set([0, 0, 0, Math.floor(Date.now() / 1000)], 4);
    rtpHeader[8] = Math.floor(Math.random() * 256);
    rtpHeader[9] = Math.floor(Math.random() * 256);
    rtpHeader[10] = Math.floor(Math.random() * 256);
    rtpHeader[11] = Math.floor(Math.random() * 256);
    const headerB64 = btoa(String.fromCharCode(...rtpHeader));
    return headerB64 + '|' + btoa(encoded);
  }

  private mediaDummyUnwrap(data: string): string {
    try {
      const parts = data.split('|');
      if (parts.length < 2) return '';
      return atob(parts[1]);
    } catch {
      return '';
    }
  }
}

export const trafficObfuscator = new TrafficObfuscator();

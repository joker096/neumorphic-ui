const PBKDF2_ITERATIONS = 100000;
const VERSION_BYTE_V1 = 0x01;
const VERSION_BYTE_V2 = 0x02;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;

interface ObfuscatorConfig {
  mode: 'aesgcm' | 'httpmask' | 'mediadummy';
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

  constructor(key: string = crypto.randomUUID(), mode: ObfuscatorConfig['mode'] = 'aesgcm') {
    this.key = key;
    this.config = { mode, userAgentPool: DEFAULT_USER_AGENTS };
  }

  setMode(mode: ObfuscatorConfig['mode']): void {
    this.config.mode = mode;
  }

  async obfuscate(data: string): Promise<string> {
    if (!data) return '';
    switch (this.config.mode) {
      case 'httpmask': return this.httpWrap(data);
      case 'mediadummy': return this.mediaDummyWrap(data);
      default: return this.aesGcmWrap(data);
    }
  }

  async deobfuscate(data: string): Promise<string> {
    if (!data) return '';
    const firstByte = data.charCodeAt(0);
    if (firstByte === VERSION_BYTE_V2) {
      return this.aesGcmUnwrap(data.slice(1));
    }
    if (firstByte === VERSION_BYTE_V1) {
      return this.xorUnshroud(data.slice(1));
    }
    switch (this.config.mode) {
      case 'httpmask': return this.httpUnwrap(data);
      case 'mediadummy': return this.mediaDummyUnwrap(data);
      default: return this.aesGcmUnwrap(data);
    }
  }

  private async aesGcmWrap(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(this.key),
      'PBKDF2',
      false,
      ['deriveKey'],
    );
    const aesKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt'],
    );
    const encoded = encoder.encode(data);
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      encoded,
    );
    const result = new Uint8Array(1 + SALT_LENGTH + IV_LENGTH + ciphertext.byteLength);
    result[0] = VERSION_BYTE_V2;
    result.set(salt, 1);
    result.set(iv, 1 + SALT_LENGTH);
    result.set(new Uint8Array(ciphertext), 1 + SALT_LENGTH + IV_LENGTH);
    return btoa(String.fromCharCode(...result));
  }

  private async aesGcmUnwrap(b64Data: string): Promise<string> {
    try {
      const raw = Uint8Array.from(atob(b64Data), (c) => c.charCodeAt(0));
      const salt = raw.slice(1, 1 + SALT_LENGTH);
      const iv = raw.slice(1 + SALT_LENGTH, 1 + SALT_LENGTH + IV_LENGTH);
      const ciphertext = raw.slice(1 + SALT_LENGTH + IV_LENGTH);
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(this.key),
        'PBKDF2',
        false,
        ['deriveKey'],
      );
      const aesKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: PBKDF2_ITERATIONS,
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt'],
      );
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        ciphertext,
      );
      return new TextDecoder().decode(decrypted);
    } catch {
      return '';
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
      'Content-Type: text/plain; charset=utf-8',
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
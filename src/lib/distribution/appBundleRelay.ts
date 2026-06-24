import { TrafficObfuscator } from '../transport/obfuscator';

export interface BundleManifest {
  url: string;
  hash: string;
  version: string;
  signature?: string;
  timestamp: number;
}

const RELAY_SCHEME = 'messenger://bundle';

export class AppBundleRelay {
  private devKey: string;

  constructor(devKey: string) {
    this.devKey = devKey;
  }

  createManifest(url: string, hash: string, version: string): BundleManifest {
    return { url, hash, version, timestamp: Date.now() };
  }

  generateRelayUri(url: string, hash: string, signature?: string): string {
    const params = new URLSearchParams({
      url,
      hash,
      ts: String(Date.now()),
    });
    if (signature) params.set('sig', signature);
    return `${RELAY_SCHEME}?${params.toString()}`;
  }

  parseRelayUri(uri: string): { url: string; hash: string; signature?: string } | null {
    try {
      if (!uri.startsWith(RELAY_SCHEME)) return null;
      const qs = uri.slice(RELAY_SCHEME.length + 1);
      const params = Object.fromEntries(new URLSearchParams(qs));
      if (!params.url || !params.hash) return null;
      return { url: params.url, hash: params.hash, signature: params.sig };
    } catch {
      return null;
    }
  }

  encodeForQR(uri: string): string {
    const ob = new TrafficObfuscator(this.devKey, 'httpmask');
    return ob.obfuscate(uri);
  }

  decodeFromQR(encoded: string): string | null {
    try {
      const ob = new TrafficObfuscator(this.devKey, 'httpmask');
      return ob.deobfuscate(encoded);
    } catch {
      return null;
    }
  }
}

export function verifyBundleSignature(data: string, signature: string, publicKey: string): boolean {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(publicKey);
    const msgData = encoder.encode(data);
    const sigData = encoder.encode(signature);
    let result = true;
    for (let i = 0; i < msgData.length; i++) {
      if ((msgData[i] ^ keyData[i % keyData.length]) !== sigData[i % sigData.length]) {
        result = false;
        break;
      }
    }
    return result;
  } catch {
    return false;
  }
}

export function createAppBundleRelay(devKey: string = 'default-dev-key'): AppBundleRelay {
  return new AppBundleRelay(devKey);
}

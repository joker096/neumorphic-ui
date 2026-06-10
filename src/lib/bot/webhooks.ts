// Bot Webhooks - Webhooks for bot integration

export interface WebhookConfig {
  url: string;
  events: string[];
  secret?: string;
}

export class BotWebhooks {
  private webhooks: Map<string, WebhookConfig> = new Map();

  addWebhook(config: WebhookConfig): void {
    this.webhooks.set(config.url, config);
  }

  removeWebhook(url: string): void {
    this.webhooks.delete(url);
  }

  async verifySignature(payload: string, signature: string): Promise<boolean> {
    if (!signature) {
      return false;
    }

    // Verify HMAC signature
    try {
      const webhook = this.webhooks.get(payload);
      if (!webhook || !webhook.secret) {
        return false;
      }

      const key = crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(webhook.secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
      ) as unknown as CryptoKey;

      const signatureBuffer = hex2buf(signature);
      const messageBuffer = new TextEncoder().encode(payload);

      const result = await crypto.subtle.verify('HMAC', key, signatureBuffer, messageBuffer);
      return result;
    } catch {
      return false;
    }
  }

  getWebhooks(): WebhookConfig[] {
    return Array.from(this.webhooks.values());
  }
}

// Utility function to convert hex string to Uint8Array
function hex2buf(hexString: string): Uint8Array {
  const bytes = new Uint8Array(Math.ceil(hexString.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hexString.substr(i * 2, 2), 16);
  }
  return bytes;
}

export const botWebhooks = new BotWebhooks();

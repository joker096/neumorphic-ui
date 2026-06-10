// Traffic Obfuscator - Obfuscates network traffic to prevent detection

export class TrafficObfuscator {
  private key: string;

  constructor(key: string = crypto.randomUUID()) {
    this.key = key;
  }

  obfuscate(data: string): string {
    // Simple XOR-based obfuscation
    const encoded = btoa(data);
    let obfuscated = '';

    for (let i = 0; i < encoded.length; i++) {
      const charCode = encoded.charCodeAt(i);
      const keyChar = this.key.charCodeAt(i % this.key.length);
      obfuscated += String.fromCharCode(charCode ^ keyChar);
    }

    return obfuscated;
  }

  deobfuscate(data: string): string {
    try {
      let deobfuscated = '';

      for (let i = 0; i < data.length; i++) {
        const charCode = data.charCodeAt(i);
        const keyChar = this.key.charCodeAt(i % this.key.length);
        deobfuscated += String.fromCharCode(charCode ^ keyChar);
      }

      return atob(deobfuscated);
    } catch {
      return '';
    }
  }
}

export const trafficObfuscator = new TrafficObfuscator();

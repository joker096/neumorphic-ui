const B32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const STEP_MS = 30_000;
const DIGITS = 6;

function bytesToBase32(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    out += B32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return out;
}

function base32ToBytes(input: string): Uint8Array {
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const idx = B32_ALPHABET.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(bytes);
}

async function hmacSha1(key: Uint8Array, msg: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key as unknown as BufferSource,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, msg as unknown as BufferSource);
  return new Uint8Array(signature);
}

function hotp(secretBytes: Uint8Array, counter: number): Promise<Uint8Array> {
  const buf = new Uint8Array(8);
  let c = Math.floor(counter);
  for (let i = 7; i >= 0; i--) {
    buf[i] = c & 0xff;
    c = Math.floor(c / 256);
  }
  return hmacSha1(secretBytes, buf);
}

function truncate(hash: Uint8Array, modulo = 10 ** DIGITS): number {
  const offset = hash[hash.length - 1] & 0x0f;
  const bin = ((hash[offset] & 0x7f) << 24) | ((hash[offset + 1] & 0xff) << 16) | ((hash[offset + 2] & 0xff) << 8) | (hash[offset + 3] & 0xff);
  return bin % modulo;
}

function padSix(code: number): string {
  return String(code).padStart(DIGITS, "0");
}

export function generateSecret(): string {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error('twoFactor: crypto.getRandomValues unavailable — insecure RNG refused');
  }
  const bytes = new Uint8Array(20);
  globalThis.crypto.getRandomValues(bytes);
  return bytesToBase32(bytes);
}

export async function totpCode(secret: string, at: number = Date.now()): Promise<string> {
  const counter = Math.floor(at / STEP_MS);
  const hash = await hotp(base32ToBytes(secret), counter);
  return padSix(truncate(hash));
}

export async function verifyTotp(secret: string, code: string, at: number = Date.now()): Promise<boolean> {
  const clean = String(code).replace(/[^0-9]/g, "");
  if (!clean || clean.length !== DIGITS) return false;
  const counter = Math.floor(at / STEP_MS);
  for (let drift = -1; drift <= 1; drift++) {
    const hash = await hotp(base32ToBytes(secret), counter + drift);
    if (padSix(truncate(hash)) === clean) return true;
  }
  return false;
}

export function otpauthUri(secret: string, account: string, issuer = "Mess&Anger"): string {
  return `otpauth://totp/${encodeURIComponent(issuer + ":" + account)}?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${DIGITS}&period=30`;
}
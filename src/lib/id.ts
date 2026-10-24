/**
 * Generate a locally-unique id. Prefers cryptographically-strong
 * `crypto.randomUUID()`; falls back to a timestamp+random string only when
 * WebCrypto is unavailable (rare non-secure contexts). Identifiers are local
 * and non-secret, but predictable ids risk same-second collisions across peers,
 * so the crypto path is always preferred.
 */
export function makeId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through to non-crypto fallback */
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface PinnedCert {
  host: string;
  fingerprint: string;
  issuer: string;
  expiresAt: number;
}

const PINNED_CERTS_KEY = 'mess_anger_pinned_certs';

export function getPinnedCerts(): PinnedCert[] {
  try {
    const raw = localStorage.getItem(PINNED_CERTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addPinnedCert(cert: PinnedCert): void {
  const certs = getPinnedCerts().filter(c => c.host !== cert.host);
  certs.push(cert);
  localStorage.setItem(PINNED_CERTS_KEY, JSON.stringify(certs));
}

export function removePinnedCert(host: string): void {
  const certs = getPinnedCerts().filter(c => c.host !== host);
  localStorage.setItem(PINNED_CERTS_KEY, JSON.stringify(certs));
}

export function isHostPinned(host: string): boolean {
  return getPinnedCerts().some(c => c.host === host);
}

export function getPinnedFingerprint(host: string): string | null {
  const cert = getPinnedCerts().find(c => c.host === host);
  return cert ? cert.fingerprint : null;
}

export async function verifyServerIdentity(host: string): Promise<{ verified: boolean; fingerprint: string }> {
  const pinned = getPinnedFingerprint(host);
  if (!pinned) {
    return { verified: true, fingerprint: 'not-pinned' };
  }

  try {
    const resp = await fetch(`https://${host}/.well-known/mess-anger-pin`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    const data = await resp.json();
    const serverFingerprint = data.fingerprint as string;

    if (serverFingerprint !== pinned) {
      console.error(`[CertPinning] Fingerprint mismatch for ${host}. Expected: ${pinned}, Got: ${serverFingerprint}`);
      return { verified: false, fingerprint: serverFingerprint };
    }

    return { verified: true, fingerprint: serverFingerprint };
  } catch (err) {
    console.warn(`[CertPinning] Could not verify ${host}:`, err);
    return { verified: false, fingerprint: 'unreachable' };
  }
}

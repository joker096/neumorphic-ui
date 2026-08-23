/**
 * Biometric app-unlock via the WebAuthn platform authenticator (Touch ID,
 * Windows Hello, Android fingerprint/face). Fully client-side: we only require
 * `userVerification`, so the device OS proves the user's presence. No server,
 * no shared secret — the credential never leaves the device.
 */

function rpId(): string {
  try {
    return window.location.hostname || 'localhost';
  } catch {
    return 'localhost';
  }
}

function bufToB64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let str = '';
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlToBuf(s: string): Uint8Array {
  const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : '';
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator.credentials !== 'undefined'
  );
}

export async function isBiometricAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  try {
    const pca = window.PublicKeyCredential as unknown as {
      isUserVerifyingPlatformAuthenticatorAvailable?: () => Promise<boolean>;
    };
    if (typeof pca.isUserVerifyingPlatformAuthenticatorAvailable !== 'function') return false;
    return await pca.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/** Register a device-bound platform passkey; returns its base64url credential id. */
export async function registerBiometric(userName: string): Promise<string> {
  if (!isWebAuthnSupported()) throw new Error('WebAuthn unavailable');
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = crypto.getRandomValues(new Uint8Array(16));
  const cred = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'Mess&Anger' },
      user: { id: userId, name: userName, displayName: userName },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
      attestation: 'none',
    },
  })) as PublicKeyCredential | null;
  if (!cred) throw new Error('Biometric registration failed');
  return bufToB64url(cred.rawId);
}

/** Verify the user via the platform authenticator. Resolves true on success. */
export async function verifyBiometric(credentialIdB64: string): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{ type: 'public-key', id: b64urlToBuf(credentialIdB64) }],
        userVerification: 'required',
        timeout: 60000,
        rpId: rpId(),
      },
    });
    return !!assertion;
  } catch {
    return false;
  }
}

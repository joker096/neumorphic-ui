/**
 * Integrity checks for P2P file transfers
 */

/** Compute the hex SHA-256 of a binary buffer. */
export async function sha256Hex(data: ArrayBuffer | Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

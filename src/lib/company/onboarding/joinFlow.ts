import type { InviteQRPayload, JoinRequest, JoinAck, CompanyUser } from '../types'
import { generateEd25519KeyPair, ed25519_sign, ed25519_verify } from '../../../lib/crypto/ed25519'
import { generateX25519KeyPair, x25519DH, buf2hex, b64encode, b64decode } from '../../../lib/crypto/cryptoCore'
import * as idb from 'idb-keyval'

// Ephemeral join keys held in memory only (never persisted to sessionStorage,
// which is readable by any injected script). Survives the request→ack round
// trip within a page session; a reload simply forces a fresh join attempt.
interface PendingJoinKeys {
  x25519Public: Uint8Array
  x25519Secret: Uint8Array
  ed25519Public: Uint8Array
  ed25519Secret: Uint8Array
  companyId: string
  displayName: string
}
let pendingJoinKeys: PendingJoinKeys | null = null

export async function initializeJoinFlow(
  invitePayload: InviteQRPayload,
  displayName: string
): Promise<JoinRequest> {
  const x25519KeyPair = generateX25519KeyPair()
  const ed25519KeyPair = generateEd25519KeyPair()

  const devicePubB64 = b64encode(x25519KeyPair.publicKey)
  const signPayload = `${invitePayload.org}:${invitePayload.code}:${devicePubB64}`
  const signature = ed25519_sign(signPayload, ed25519KeyPair.secretKey)

  const joinRequest: JoinRequest = {
    type: 'company-join-request',
    companyId: invitePayload.org,
    inviteCode: invitePayload.code,
    devicePublicKey: devicePubB64,
    signature: b64encode(signature),
    displayName,
  }

  pendingJoinKeys = {
    x25519Public: x25519KeyPair.publicKey,
    x25519Secret: x25519KeyPair.secretKey,
    ed25519Public: ed25519KeyPair.publicKey,
    ed25519Secret: ed25519KeyPair.secretKey,
    companyId: invitePayload.org,
    displayName,
  }

  return joinRequest
}

export async function handleJoinAck(ack: JoinAck): Promise<{ user: CompanyUser; groupKey: CryptoKey } | null> {
  const keys = pendingJoinKeys
  if (!keys) return null

  const myPrivKey = keys.x25519Secret

  const wrappedByPub = b64decode(ack.wrappedBy)
  const sharedSecret = x25519DH(myPrivKey, wrappedByPub)

  const unwrapKey = await crypto.subtle.importKey(
    'raw',
    sharedSecret.slice(0, 32),
    'AES-GCM',
    false,
    ['decrypt']
  )

  const ackData = parseAckData(ack.groupKey)
  if (!ackData.iv || !ackData.ciphertext) return null

  const groupKeyBytes = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ackData.iv },
    unwrapKey,
    ackData.ciphertext
  )

  const groupKey = await crypto.subtle.importKey(
    'raw',
    groupKeyBytes,
    'AES-GCM',
    false,
    ['encrypt', 'decrypt']
  )

  const user: CompanyUser = {
    userId: generateUserId(),
    companyId: keys.companyId,
    displayName: keys.displayName,
    publicKey: keys.x25519Public,
    signatureKey: keys.ed25519Public,
    devices: [],
    joinedAt: Date.now(),
    role: 'member',
  }

  await saveUserKeys(user.userId, {
    x25519Secret: keys.x25519Secret,
    ed25519Secret: keys.ed25519Secret,
  })

  pendingJoinKeys = null

  return { user, groupKey }
}

export function verifyInviteSignature(
  payload: { org: string; code: string },
  signatureB64: string,
  adminPubKeyB64: string
): boolean {
  const adminPubKey = b64decode(adminPubKeyB64)
  const signature = b64decode(signatureB64)
  const signPayload = `${payload.org}:${payload.code}`
  return ed25519_verify(signPayload, signature, adminPubKey)
}

function generateUserId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  const b64 = buf2hex(bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  return `usr_${b64}`
}

async function saveUserKeys(userId: string, keys: { x25519Secret: Uint8Array; ed25519Secret: Uint8Array }): Promise<void> {
  await idb.set(`mess_company_user_keys_${userId}`, {
    x25519Secret: buf2hex(keys.x25519Secret),
    ed25519Secret: buf2hex(keys.ed25519Secret),
  })
}

function parseAckData(groupKeyB64: string): { iv: Uint8Array; ciphertext: Uint8Array } {
  const decoded = b64decode(groupKeyB64)
  const iv = decoded.slice(0, 12)
  const ciphertext = decoded.slice(12)
  return { iv, ciphertext }
}
import * as nacl from 'tweetnacl'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// In-memory idb-keyval so masterKey + identityPin + deviceSecurity run the real
// crypto flows against an isolated store (no fake-indexeddb dependency).
const idbStorage = vi.hoisted(() => {
  const store = new Map<string, unknown>()
  return {
    store,
    get: async (k: string) => store.get(k),
    set: async (k: string, v: unknown) => { store.set(k, v) },
    del: async (k: string) => { store.delete(k) },
  }
})
vi.mock('idb-keyval', () => ({
  get: idbStorage.get,
  set: idbStorage.set,
  del: idbStorage.del,
}))

import { getMasterKeySet } from '../identity/masterKey'
import { generateX25519KeyPair, deriveSharedSessionKeys, buf2hex, hex2buf, cryptoCore } from '../crypto/cryptoCore'
import { computeSafetyNumber } from '../crypto/safetyNumber'
import { signDh, verifyDhSignature, verifyOrPinPeer, getPinnedIdentity, resetIdentityPins } from './identityPin'
import { P2PTransport } from './P2PTransport'
import { handleWsClose } from './p2pSignaling'

let mockWs: any = null
let onMessage: ReturnType<typeof vi.fn>
let onConnected: ReturnType<typeof vi.fn>
let onDisconnected: ReturnType<typeof vi.fn>

class MockWebSocket {
  static OPEN = 1
  static CONNECTING = 0
  static CLOSING = 2
  static CLOSED = 3
  readyState = MockWebSocket.OPEN
  send = vi.fn()
  close = vi.fn()
  onopen: any = null
  onclose: any = null
  onerror: any = null
  onmessage: any = null
  constructor(_url: string) {
    mockWs = this
  }
}

beforeEach(() => {
  vi.restoreAllMocks()
  mockWs = null
  onMessage = vi.fn()
  onConnected = vi.fn()
  onDisconnected = vi.fn()
  vi.stubGlobal('WebSocket', MockWebSocket)
  // Avoid real network during token fetch; getRelayToken() rejects fast -> ''
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline in tests')))
})

afterEach(async () => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  await resetIdentityPins()
})

function makeTransport() {
  return new P2PTransport({
    signalingUrl: 'ws://localhost:8080',
    localPublicKey: 'lifecycle-pub-key',
    onMessage: onMessage as any,
    onConnected,
    onDisconnected,
  } as any)
}

async function connectTransport(transport: P2PTransport): Promise<void> {
  const p = transport.connect()
  await new Promise<void>((r) => setTimeout(r, 0))
  mockWs.onopen()
  mockWs.onmessage({ data: JSON.stringify({ type: 'registered' }) })
  await p
}

describe('S6 security lifecycle: register -> pair -> verify -> encrypt -> reconnect', () => {
  it('register: master keypair is deterministic and produces 32B public + 64B secret Ed25519', async () => {
    const first = await getMasterKeySet()
    const second = await getMasterKeySet()
    expect(first.ed25519Public).toBeInstanceOf(Uint8Array)
    expect(first.ed25519Secret).toBeInstanceOf(Uint8Array)
    expect(first.ed25519Public.byteLength).toBe(32)
    expect(first.ed25519Secret.byteLength).toBe(64)
    expect(second.ed25519Public).toEqual(first.ed25519Public)
    expect(second.ed25519Secret).toEqual(first.ed25519Secret)
  })

  it('pair: DH public key signed by Ed25519 identity verifies; forged signature rejected', async () => {
    const { ed25519Secret, ed25519Public } = await getMasterKeySet()
    const identityPubHex = buf2hex(ed25519Public)
    const dhPubHex = buf2hex(generateX25519KeyPair().publicKey)
    const sig = signDh(ed25519Secret, dhPubHex)
    expect(verifyDhSignature(identityPubHex, dhPubHex, sig)).toBe(true)
    // Forge: complement the first nibble -> signature no longer matches
    const forged = (parseInt(sig[0], 16) ^ 1).toString(16) + sig.slice(1)
    expect(verifyDhSignature(identityPubHex, dhPubHex, forged)).toBe(false)
  })

  it('verify: TOFU pins first-seen identity, rejects attacker swap, survived across calls', async () => {
    const { ed25519Secret, ed25519Public } = await getMasterKeySet()
    const identityPubHex = buf2hex(ed25519Public)
    const dhPubHex = buf2hex(generateX25519KeyPair().publicKey)
    const sig = signDh(ed25519Secret, dhPubHex)

    // First contact: valid identity -> pinned, verified
    await expect(verifyOrPinPeer('peer-alice', identityPubHex, dhPubHex, sig)).resolves.toBe(true)
    await expect(getPinnedIdentity('peer-alice')).resolves.toBe(identityPubHex)

    // Attacker: same peer id, valid self-signed identity but DIFFERENT key -> rejected
    const attackerKp = generateX25519KeyPair()
    const attackerIdentity = nacl.sign.keyPair()
    const attackerSig = signDh(attackerIdentity.secretKey, buf2hex(attackerKp.publicKey))
    await expect(verifyOrPinPeer('peer-alice', buf2hex(attackerIdentity.publicKey), buf2hex(attackerKp.publicKey), attackerSig)).resolves.toBe(false)
    // Pin unchanged
    await expect(getPinnedIdentity('peer-alice')).resolves.toBe(identityPubHex)

    // Re-verify with the original identity: still accepted (stable pin, no false alarm)
    await expect(verifyOrPinPeer('peer-alice', identityPubHex, dhPubHex, sig)).resolves.toBe(true)
  })

  it('encrypt: symmetric session keys equal on both sides; AES-GCM round-trip; wrong key rejects', async () => {
    const kpA = generateX25519KeyPair()
    const kpB = generateX25519KeyPair()
    const sessionA = deriveSharedSessionKeys(kpA.secretKey, kpB.publicKey)
    const sessionB = deriveSharedSessionKeys(kpB.secretKey, kpA.publicKey)
    expect(sessionA.hmacKey).toBe(sessionB.hmacKey)
    expect(sessionA.aesKeyHex).toBe(sessionB.aesKeyHex)
    expect(sessionA.hmacKey).not.toBe(sessionA.aesKeyHex)
    expect(sessionA.aesKeyHex).toMatch(/^[0-9a-f]{64}$/)

    const key = await crypto.subtle.importKey(
      'raw', hex2buf(sessionA.aesKeyHex), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'],
    )
    const { cipher, iv } = await cryptoCore.encryptData('hello secure channel', key)
    await expect(cryptoCore.decryptData(cipher, iv, key)).resolves.toBe('hello secure channel')

    // Tampered ciphertext (any bit flip) must fail AES-GCM auth
    const flipped = (cipher.slice(0, 2) === '00' ? 'ff' : '00') + cipher.slice(2)
    await expect(cryptoCore.decryptData(flipped, iv, key)).rejects.toThrow()

    // Wrong session key (attacker's DH) must not decrypt
    const kpC = generateX25519KeyPair()
    const sessionC = deriveSharedSessionKeys(kpA.secretKey, kpC.publicKey)
    const wrongKey = await crypto.subtle.importKey(
      'raw', hex2buf(sessionC.aesKeyHex), { name: 'AES-GCM' }, false, ['decrypt'],
    )
    await expect(cryptoCore.decryptData(cipher, iv, wrongKey)).rejects.toThrow()
  })

  it('safety number: deterministic fingerprint, order-independent, differs between identities', async () => {
    const kpA = generateX25519KeyPair()
    const kpB = generateX25519KeyPair()
    const kpC = generateX25519KeyPair()
    const a = buf2hex(kpA.publicKey)
    const b = buf2hex(kpB.publicKey)
    const c = buf2hex(kpC.publicKey)
    const ab = await computeSafetyNumber(a, b)
    expect(ab).toBe(await computeSafetyNumber(a, b))
    // Sorted-concatenation: same number regardless of argument order
    expect(ab).toBe(await computeSafetyNumber(b, a))
    expect(ab).not.toBe(await computeSafetyNumber(a, c))
  })

  it('reconnect: exponential backoff [1000..30000] then cap; stops at max attempts; resets on re-register', async () => {
    vi.useFakeTimers()
    const delays: number[] = []
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout').mockImplementation(((fn: () => void, delay?: number) => {
      delays.push(delay ?? 0)
      return 0 as unknown as ReturnType<typeof setTimeout>
    }) as typeof setTimeout)

    const t = makeTransport()
    // No peerPublicKey -> onDisconnected skipped; pure backoff sequence
    for (let i = 0; i < 11; i++) {
      ;handleWsClose(t)
    }
    expect(delays).toEqual([1000, 2000, 4000, 8000, 16000, 30000, 30000, 30000, 30000, 30000])
    expect((t as any).reconnectAttempts).toBe(10)

    setTimeoutSpy.mockRestore()
    vi.useRealTimers()

    // Real path: connect -> registered resets the counter; ws drop schedules a single retry
    const t2 = makeTransport()
    await connectTransport(t2)
    expect((t2 as any).reconnectAttempts).toBe(0)
    mockWs.onclose()
    expect((t2 as any).reconnectAttempts).toBe(1)
  })
})
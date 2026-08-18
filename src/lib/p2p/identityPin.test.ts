import { describe, it, expect } from 'vitest'
import * as nacl from 'tweetnacl'
import {
  signDh,
  verifyDhSignature,
  verifyOrPinPeer,
  resetIdentityPins,
  getPinnedIdentity,
} from './identityPin'
import { buf2hex } from '../crypto/cryptoCore'

describe('identityPin (K1 authenticated ECDH)', () => {
  const idA = nacl.sign.keyPair()
  const idB = nacl.sign.keyPair()
  const idPubA = buf2hex(idA.publicKey)
  const idPubB = buf2hex(idB.publicKey)
  const dhPub = buf2hex(nacl.box.keyPair().publicKey)

  it('signs and verifies a DH public key with the local identity', () => {
    const sig = signDh(idA.secretKey, dhPub)
    expect(verifyDhSignature(idPubA, dhPub, sig)).toBe(true)
  })

  it('rejects a signature forged by a different identity', () => {
    const sig = signDh(idB.secretKey, dhPub)
    expect(verifyDhSignature(idPubA, dhPub, sig)).toBe(false)
  })

  it('rejects a tampered DH public key', () => {
    const sig = signDh(idA.secretKey, dhPub)
    const otherDh = buf2hex(nacl.box.keyPair().publicKey)
    expect(verifyDhSignature(idPubA, otherDh, sig)).toBe(false)
  })

  it('pins identity on first contact and accepts re-contact', async () => {
    await resetIdentityPins()
    const sig = signDh(idA.secretKey, dhPub)
    expect(await verifyOrPinPeer('peer1', idPubA, dhPub, sig)).toBe(true)
    expect(await getPinnedIdentity('peer1')).toBe(idPubA)
    const sig2 = signDh(idA.secretKey, dhPub)
    expect(await verifyOrPinPeer('peer1', idPubA, dhPub, sig2)).toBe(true)
  })

  it('rejects an identity that differs from the pinned one (signaling MITM)', async () => {
    await resetIdentityPins()
    expect(await verifyOrPinPeer('peer2', idPubA, dhPub, signDh(idA.secretKey, dhPub))).toBe(true)
    const attackerSig = signDh(idB.secretKey, dhPub)
    expect(await verifyOrPinPeer('peer2', idPubB, dhPub, attackerSig)).toBe(false)
  })

  it('rejects an invalid signature', async () => {
    await resetIdentityPins()
    expect(await verifyOrPinPeer('peer3', idPubA, dhPub, '00'.repeat(64))).toBe(false)
  })
})

import * as nacl from 'tweetnacl'
import { b64encode, b64decode } from '../crypto/cryptoCore'
import type { MasterKeySet } from './masterKey'

export interface DeviceKeyPair {
  deviceId: string
  name: string
  x25519Secret: Uint8Array
  x25519Public: Uint8Array
  signature: Uint8Array
  createdAt: string
}

export function generateDeviceKeyPair(master: MasterKeySet, name: string): DeviceKeyPair {
  const kp = nacl.box.keyPair()
  const signature = nacl.sign.detached(kp.publicKey, master.ed25519Secret)
  return {
    deviceId: 'dvc_' + b64encode(kp.publicKey).replace(/[+/=]/g, '').slice(0, 16),
    name,
    x25519Secret: kp.secretKey,
    x25519Public: kp.publicKey,
    signature,
    createdAt: new Date().toISOString(),
  }
}

export function verifyDeviceKey(
  device: { x25519Public: Uint8Array; signature: Uint8Array },
  masterEd25519Public: Uint8Array,
): boolean {
  return nacl.sign.detached.verify(device.x25519Public, device.signature, masterEd25519Public)
}

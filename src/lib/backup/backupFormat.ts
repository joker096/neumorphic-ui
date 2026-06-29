const MAGIC = new Uint8Array([0x4D, 0x41, 0x42, 0x41, 0x4B, 0x00])
const VERSION = 1

export interface MabakHeader {
  version: number
  hasTotp: boolean
  salt: Uint8Array
  iv: Uint8Array
}

export interface MabakFile {
  header: MabakHeader
  payload: Uint8Array
  hmac: Uint8Array
}

export function encodeMabak(encryptedPayload: Uint8Array, salt: Uint8Array, iv: Uint8Array, hmac: Uint8Array): Uint8Array {
  const flags = 0
  const headerLen = 6 + 1 + 1 + 32 + 12
  const header = new Uint8Array(headerLen)
  let offset = 0
  header.set(MAGIC, offset); offset += 6
  header[offset++] = VERSION
  header[offset++] = flags
  header.set(salt, offset); offset += 32
  header.set(iv, offset); offset += 12

  const totalLen = headerLen + encryptedPayload.length + 32
  const result = new Uint8Array(totalLen)
  result.set(header, 0)
  result.set(encryptedPayload, headerLen)
  result.set(hmac, headerLen + encryptedPayload.length)
  return result
}

export function decodeMabak(data: Uint8Array): MabakFile {
  let offset = 0
  const magic = data.slice(0, 6)
  for (let i = 0; i < 6; i++) {
    if (magic[i] !== MAGIC[i]) throw new Error('Invalid backup file: bad magic')
  }
  offset += 6
  const version = data[offset++]
  const flags = data[offset++]
  const salt = data.slice(offset, offset + 32); offset += 32
  const iv = data.slice(offset, offset + 12); offset += 12
  const payloadLen = data.length - offset - 32
  if (payloadLen < 1) throw new Error('Invalid backup file: no payload')
  const payload = data.slice(offset, offset + payloadLen); offset += payloadLen
  const hmac = data.slice(offset, offset + 32)
  return {
    header: { version, hasTotp: !!(flags & 1), salt, iv },
    payload,
    hmac,
  }
}

export function mabakToBlob(data: Uint8Array): Blob {
  return new Blob([data], { type: 'application/octet-stream' })
}

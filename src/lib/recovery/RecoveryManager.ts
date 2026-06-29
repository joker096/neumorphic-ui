import { buf2hex, hex2buf } from '../crypto/cryptoCore'
import { generateMnemonic as genMnemonic, validateMnemonic as validateMnemonicFn, mnemonicToEntropy, entropyToHex } from './MnemonicGenerator'
import { deviceSecurity } from '../deviceSecurity'
import { deriveKeysFromSeed, generateMasterSeed } from '../identity/masterKey'
import type { MasterKeySet } from '../identity/masterKey'
import { setSessionMasterKey } from '../../store'

const RECOVERY_HASH_KEY = 'app_recovery_hash'

export const RecoveryManager = {
  async generateRecoveryPhrase(): Promise<{ phrase: string; masterKeySet: MasterKeySet }> {
    const seed = await generateMasterSeed()
    const masterKeySet = await deriveKeysFromSeed(seed)
    const phrase = genMnemonic(seed)

    const salt = crypto.getRandomValues(new Uint8Array(16))
    const phraseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(phrase), 'PBKDF2', false, ['deriveBits'])
    const derivedBits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
      phraseKey,
      256,
    )
    const hashHex = buf2hex(derivedBits)
    localStorage.setItem(RECOVERY_HASH_KEY, `${buf2hex(salt)}:${hashHex}`)

    await deviceSecurity.storeMasterKeyHex(masterKeySet.aesKeyHex)
    setSessionMasterKey(masterKeySet.aesKey)

    return { phrase, masterKeySet }
  },

  async restoreFromPhrase(phrase: string): Promise<boolean> {
    const storedHash = localStorage.getItem(RECOVERY_HASH_KEY)
    if (!storedHash || !storedHash.includes(':')) return false
    const [saltHex, expectedHash] = storedHash.split(':')

    if (!validateMnemonicFn(phrase)) return false
    const entropy = mnemonicToEntropy(phrase)
    if (!entropy) return false

    const phraseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(phrase), 'PBKDF2', false, ['deriveBits'])
    const derivedBits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: hex2buf(saltHex), iterations: 600000, hash: 'SHA-256' },
      phraseKey,
      256,
    )
    if (buf2hex(derivedBits) !== expectedHash) return false

    const masterKeySet = await deriveKeysFromSeed(entropy)
    await deviceSecurity.storeMasterKeyHex(masterKeySet.aesKeyHex)
    setSessionMasterKey(masterKeySet.aesKey)

    return true
  },

  hasRecoveryPhrase(): boolean {
    return !!localStorage.getItem(RECOVERY_HASH_KEY)
  },

  clearRecoveryHash(): void {
    localStorage.removeItem(RECOVERY_HASH_KEY)
  },
}

export { genMnemonic as generateMnemonic, validateMnemonicFn as validateMnemonic, mnemonicToEntropy, entropyToHex }

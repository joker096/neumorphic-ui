import { generateMnemonic as bip39Generate, mnemonicToEntropy as bip39ToEntropy, entropyToMnemonic } from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english.js'

export function generateMnemonic(entropy?: Uint8Array): string {
  if (entropy) {
    return entropyToMnemonic(entropy, wordlist)
  }
  return bip39Generate(wordlist, 256)
}

export function validateMnemonic(phrase: string): boolean {
  const words = phrase.trim().toLowerCase().split(/\s+/)
  if (words.length !== 24) return false
  return words.every(w => wordlist.includes(w))
}

export function mnemonicToEntropy(phrase: string): Uint8Array | null {
  try {
    return bip39ToEntropy(phrase, wordlist)
  } catch {
    return null
  }
}

export function entropyToHex(entropy: Uint8Array): string {
  return Array.from(entropy).map(b => b.toString(16).padStart(2, '0')).join('')
}

export function hexToEntropy(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
  }
  return bytes
}

export { wordlist as WORD_LIST }

import { describe, it, expect } from 'vitest'
import { generateMnemonic, validateMnemonic, mnemonicToEntropy, entropyToHex, WORD_LIST } from '../src/lib/recovery/MnemonicGenerator'

describe('MnemonicGenerator', () => {
  it('should generate a valid 24-word mnemonic', () => {
    const mnemonic = generateMnemonic()
    expect(validateMnemonic(mnemonic)).toBe(true)
    expect(mnemonic.split(' ').length).toBe(24)
  })

  it('should validate word list has 2048 entries', () => {
    expect(WORD_LIST.length).toBe(2048)
  })

  it('should reject invalid mnemonic', () => {
    expect(validateMnemonic('')).toBe(false)
    expect(validateMnemonic('word1 word2')).toBe(false)
    expect(validateMnemonic('invalidword ' + Array(24).fill(WORD_LIST[0]).join(' '))).toBe(false)
  })

  it('should convert mnemonic to 32-byte entropy', () => {
    const mnemonic = generateMnemonic()
    const entropy = mnemonicToEntropy(mnemonic)
    expect(entropy).toBeDefined()
    expect(entropy?.length).toBe(32)
  })

  it('should convert entropy to hex', () => {
    const entropy = new Uint8Array(16)
    for (let i = 0; i < 16; i++) {
      entropy[i] = i
    }
    const hex = entropyToHex(entropy)
    expect(hex).toHaveLength(32)
    expect(hex).toBe('000102030405060708090a0b0c0d0e0f')
  })

  it('should be deterministic', () => {
    const mnemonic1 = generateMnemonic()
    const mnemonic2 = generateMnemonic()
    expect(mnemonic1).not.toBe(mnemonic2)
    const entropy1 = mnemonicToEntropy(mnemonic1)
    const entropy2 = mnemonicToEntropy(mnemonic1)
    expect(entropy1).toEqual(entropy2)
  })
})

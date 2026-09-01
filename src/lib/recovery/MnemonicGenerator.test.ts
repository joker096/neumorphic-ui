import { describe, expect, it } from "vitest";
import {
  WORD_LIST,
  entropyToHex,
  generateMnemonic,
  hexToEntropy,
  mnemonicToEntropy,
  validateMnemonic,
} from "./MnemonicGenerator";

describe("MnemonicGenerator", () => {
  it("generates a 24-word English mnemonic", () => {
    const phrase = generateMnemonic();
    const words = phrase.split(" ");
    expect(words).toHaveLength(24);
    expect(words.every((word) => WORD_LIST.includes(word))).toBe(true);
  });

  it("is deterministic for provided entropy", () => {
    const entropy = hexToEntropy("01".repeat(32));
    expect(generateMnemonic(entropy)).toBe(generateMnemonic(entropy));
  });

  it("validates phrases with 24 valid wordlist words", () => {
    expect(validateMnemonic(generateMnemonic())).toBe(true);
    expect(validateMnemonic(`${Array(24).fill("abandon").join(" ")}`)).toBe(true);
  });

  it("normalizes whitespace and case before validation", () => {
    const phrase = generateMnemonic();
    expect(validateMnemonic(`  ${phrase.toUpperCase()}  `)).toBe(true);
  });

  it("rejects phrases with the wrong word count", () => {
    const phrase = generateMnemonic();
    expect(validateMnemonic(phrase.slice(0, -8))).toBe(false);
    expect(validateMnemonic("abandon".repeat(12))).toBe(false);
  });

  it("rejects phrases containing unknown words", () => {
    const words = generateMnemonic().split(" ");
    words[0] = "not-a-word";
    expect(validateMnemonic(words.join(" "))).toBe(false);
  });

  it("converts a generated phrase back to 32 bytes of entropy", () => {
    const entropy = mnemonicToEntropy(generateMnemonic());
    expect(entropy).toBeInstanceOf(Uint8Array);
    expect(entropy).toHaveLength(32);
  });

  it("returns null for invalid mnemonics", () => {
    expect(mnemonicToEntropy("abandon".repeat(12))).toBeNull();
    expect(mnemonicToEntropy("not a valid phrase")).toBeNull();
    expect(mnemonicToEntropy("")).toBeNull();
  });

  it("round-trips entropy through hex", () => {
    const hex = "00ff10abcdef";
    expect(entropyToHex(hexToEntropy(hex))).toBe(hex);
    expect(Array.from(hexToEntropy("01ff"))).toEqual([1, 255]);
  });

  it("exposes the full BIP39 English wordlist", () => {
    expect(WORD_LIST).toHaveLength(2048);
    expect(WORD_LIST[0]).toBe("abandon");
  });

  it("handles empty hex entropy", () => {
    expect(hexToEntropy("")).toHaveLength(0);
  });
});

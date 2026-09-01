import { describe, expect, it } from "vitest";
import nodeCrypto from "node:crypto";
import { HMACAuth } from "./HMACAuth";

describe("HMACAuth", () => {
  const keyHex = "00".repeat(32);

  it("generates a 256-bit hex key", async () => {
    const key = await HMACAuth.generateKey();
    expect(key).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces a known HMAC-SHA256 signature", async () => {
    const data = "hello p2p";
    const expected = nodeCrypto
      .createHmac("sha256", new Uint8Array(32))
      .update(data)
      .digest("hex");

    await expect(HMACAuth.sign(keyHex, data)).resolves.toBe(expected);
  });

  it("is deterministic for the same key and data", async () => {
    const data = "deterministic";
    const [first, second] = await Promise.all([
      HMACAuth.sign(keyHex, data),
      HMACAuth.sign(keyHex, data),
    ]);

    expect(first).toBe(second);
  });

  it("changes signature when data changes", async () => {
    const [first, second] = await Promise.all([
      HMACAuth.sign(keyHex, "one"),
      HMACAuth.sign(keyHex, "two"),
    ]);

    expect(first).not.toBe(second);
  });

  it("verifies a valid signature", async () => {
    const data = "verify me";
    const signature = await HMACAuth.sign(keyHex, data);
    await expect(HMACAuth.verify(keyHex, data, signature)).resolves.toBe(true);
  });

  it("rejects invalid signature data", async () => {
    const data = "verify me";
    const signature = await HMACAuth.sign(keyHex, data);

    await expect(HMACAuth.verify(keyHex, "tampered", signature)).resolves.toBe(false);
    await expect(HMACAuth.verify("ff".repeat(32), data, signature)).resolves.toBe(false);
  });

  it("rejects malformed signature hex without throwing", async () => {
    await expect(HMACAuth.verify(keyHex, "data", "not-hex")).resolves.toBe(false);
  });

  it("rejects malformed key hex without throwing", async () => {
    await expect(HMACAuth.verify("zz", "data", "00".repeat(32))).resolves.toBe(false);
  });
});

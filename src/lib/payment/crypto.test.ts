import { describe, expect, it } from "vitest";
import nodeCrypto from "node:crypto";
import { verifyPaymentoSignature } from "./crypto";

function expectedSignature(payload: string, secret: string): string {
  return nodeCrypto.createHmac("sha256", secret).update(payload).digest("hex").toUpperCase();
}

describe("verifyPaymentoSignature", () => {
  const payload = JSON.stringify({ order_id: "ord_123", amount: 100, currency: "USD" });
  const secret = "test-secret";

  it("accepts a matching uppercase signature", async () => {
    const signature = expectedSignature(payload, secret);
    await expect(verifyPaymentoSignature(payload, signature, secret)).resolves.toBe(true);
  });

  it("accepts a lowercase signature", async () => {
    const signature = expectedSignature(payload, secret).toLowerCase();
    await expect(verifyPaymentoSignature(payload, signature, secret)).resolves.toBe(true);
  });

  it("rejects a signature for a different payload", async () => {
    const signature = expectedSignature("other-payload", secret);
    await expect(verifyPaymentoSignature(payload, signature, secret)).resolves.toBe(false);
  });

  it("rejects a signature computed with a different secret", async () => {
    const signature = expectedSignature(payload, "other-secret");
    await expect(verifyPaymentoSignature(payload, signature, secret)).resolves.toBe(false);
  });

  it("returns false for empty signature or secret", async () => {
    await expect(verifyPaymentoSignature(payload, "", secret)).resolves.toBe(false);
    await expect(verifyPaymentoSignature(payload, expectedSignature(payload, secret), "")).resolves.toBe(false);
  });

  it("rejects length-mismatched signatures", async () => {
    const signature = expectedSignature(payload, secret);
    await expect(verifyPaymentoSignature(payload, signature.slice(0, -1), secret)).resolves.toBe(false);
    await expect(verifyPaymentoSignature(payload, `${signature}0`, secret)).resolves.toBe(false);
  });
});

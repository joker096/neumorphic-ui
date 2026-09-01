import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("MOCK_DATA_ENABLED", () => {
  async function loadFlag() {
    vi.resetModules();
    const mod = await import("./mockDataFlag");
    return mod.MOCK_DATA_ENABLED;
  }

  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("VITE_USE_MOCK", "false");
    vi.stubEnv("NEXT_PUBLIC_USE_MOCK", "false");
    vi.stubEnv("REACT_APP_USE_MOCK", "false");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("defaults to false when no mock environment flag is set", async () => {
    await expect(loadFlag()).resolves.toBe(false);
  });

  it("enables mock data from VITE_USE_MOCK", async () => {
    vi.stubEnv("VITE_USE_MOCK", "true");
    await expect(loadFlag()).resolves.toBe(true);
  });

  it("enables mock data from NEXT_PUBLIC_USE_MOCK", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCK", "true");
    await expect(loadFlag()).resolves.toBe(true);
  });

  it("enables mock data from REACT_APP_USE_MOCK", async () => {
    vi.stubEnv("REACT_APP_USE_MOCK", "true");
    await expect(loadFlag()).resolves.toBe(true);
  });

  it("stays false for non-boolean flag values", async () => {
    vi.stubEnv("VITE_USE_MOCK", "false");
    vi.stubEnv("NEXT_PUBLIC_USE_MOCK", "false");
    vi.stubEnv("REACT_APP_USE_MOCK", "false");
    await expect(loadFlag()).resolves.toBe(false);
  });
});

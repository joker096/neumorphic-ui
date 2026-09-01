import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../config/signalling", () => ({
  get SIGNALING_SEED_URLS() {
    return (globalThis as any).__SIGNALING_SEED_URLS ?? [];
  },
}));

import { withToken } from "./relayToken";

function setSeedUrls(urls: string[]) {
  (globalThis as any).__SIGNALING_SEED_URLS = urls;
}

async function loadRelayTokenModule(restUrlOverride?: string) {
  vi.stubEnv("VITE_SIGNALING_REST_URL", restUrlOverride ?? "");
  vi.resetModules();
  return await import("./relayToken");
}

function okResponse(payload: unknown) {
  return { ok: true, status: 200, json: async () => payload };
}

describe("relayToken", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.restoreAllMocks();
    (globalThis as any).__SIGNALING_SEED_URLS = [];
  });

  describe("withToken", () => {
    it("returns the original URL when no token is supplied", () => {
      expect(withToken("wss://relay.test/wss", "")).toBe("wss://relay.test/wss");
    });

    it("adds a token query parameter", () => {
      expect(withToken("wss://relay.test/wss", "abc")).toBe("wss://relay.test/wss?token=abc");
    });

    it("preserves existing query parameters and encodes the token", () => {
      expect(withToken("wss://relay.test/wss?channel=1", "a b&c")).toBe(
        "wss://relay.test/wss?channel=1&token=a%20b%26c",
      );
    });
  });

  describe("getRelayToken", () => {
    it("returns an empty token when no REST base can be derived", async () => {
      setSeedUrls([]);
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      const mod = await loadRelayTokenModule();

      await expect(mod.getRelayToken()).resolves.toBe("");
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("returns an empty token for an invalid WebSocket URL", async () => {
      setSeedUrls(["not-a-url"]);
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      const mod = await loadRelayTokenModule();

      await expect(mod.getRelayToken()).resolves.toBe("");
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("returns an empty token when fetch is unavailable", async () => {
      setSeedUrls(["wss://relay.test:8080"]);
      vi.stubGlobal("fetch", undefined);
      const mod = await loadRelayTokenModule();

      await expect(mod.getRelayToken()).resolves.toBe("");
    });

    it("fetches a token and caches it", async () => {
      setSeedUrls(["wss://relay.test:8080"]);
      const fetchMock = vi.fn().mockResolvedValue(okResponse({ token: "cached-token" }));
      vi.stubGlobal("fetch", fetchMock);
      vi.spyOn(Date, "now").mockReturnValue(1000);
      const mod = await loadRelayTokenModule();

      const first = await mod.getRelayToken();
      const second = await mod.getRelayToken();

      expect(first).toBe("cached-token");
      expect(second).toBe("cached-token");
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(
        "https://relay.test:8080/api/auth/token",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        }),
      );
    });

    it("sends the caller id when provided", async () => {
      setSeedUrls(["wss://relay.test:8080"]);
      const fetchMock = vi.fn().mockResolvedValue(okResponse({ token: "id-token" }));
      vi.stubGlobal("fetch", fetchMock);
      vi.spyOn(Date, "now").mockReturnValue(1000);
      const mod = await loadRelayTokenModule();

      await mod.getRelayToken("user-1");

      expect(fetchMock).toHaveBeenCalledWith(
        "https://relay.test:8080/api/auth/token",
        expect.objectContaining({ body: JSON.stringify({ id: "user-1" }) }),
      );
    });

    it("uses the configured REST URL override", async () => {
      setSeedUrls([]);
      const fetchMock = vi.fn().mockResolvedValue(okResponse({ token: "override-token" }));
      vi.stubGlobal("fetch", fetchMock);
      vi.spyOn(Date, "now").mockReturnValue(1000);
      const mod = await loadRelayTokenModule("https://override.test/");

      await mod.getRelayToken();

      expect(fetchMock).toHaveBeenCalledWith(
        "https://override.test/api/auth/token",
        expect.anything(),
      );
    });

    it("refreshes after the cached token expires", async () => {
      setSeedUrls(["wss://relay.test:8080"]);
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(okResponse({ token: "first" }))
        .mockResolvedValueOnce(okResponse({ token: "second" }));
      vi.stubGlobal("fetch", fetchMock);
      let now = 1000;
      vi.spyOn(Date, "now").mockImplementation(() => now);
      const mod = await loadRelayTokenModule();

      await mod.getRelayToken();
      now = 1000 + 45 * 60 * 1000 + 1;
      const second = await mod.getRelayToken();

      expect(second).toBe("second");
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("deduplicates concurrent fetches", async () => {
      setSeedUrls(["wss://relay.test:8080"]);
      let resolveFetch: (value: any) => void = () => {};
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });
      const fetchMock = vi.fn().mockImplementation(() => fetchPromise);
      vi.stubGlobal("fetch", fetchMock);
      vi.spyOn(Date, "now").mockReturnValue(1000);
      const mod = await loadRelayTokenModule();

      const first = mod.getRelayToken();
      const second = mod.getRelayToken();
      expect(fetchMock).toHaveBeenCalledTimes(1);

      resolveFetch(okResponse({ token: "shared" }));
      await Promise.all([first, second]);

      expect(await first).toBe("shared");
      expect(await second).toBe("shared");
    });

    it("rejects non-OK responses", async () => {
      setSeedUrls(["wss://relay.test:8080"]);
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }),
      );
      const mod = await loadRelayTokenModule();

      await expect(mod.getRelayToken()).rejects.toThrow("relay token fetch failed: 500");
    });

    it("rejects responses without a token", async () => {
      setSeedUrls(["wss://relay.test:8080"]);
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({})));
      const mod = await loadRelayTokenModule();

      await expect(mod.getRelayToken()).rejects.toThrow("relay token missing in response");
    });

    it("propagates fetch errors", async () => {
      setSeedUrls(["wss://relay.test:8080"]);
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
      const mod = await loadRelayTokenModule();

      await expect(mod.getRelayToken()).rejects.toThrow("network down");
    });

    it("aborts the request after 3 seconds", async () => {
      vi.useFakeTimers();
      setSeedUrls(["wss://relay.test:8080"]);
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation((_url: string, init: any) => {
          return new Promise((_resolve, reject) => {
            init.signal.addEventListener("abort", () => reject(new Error("aborted")));
          });
        }),
      );
      const mod = await loadRelayTokenModule();

      const token = mod.getRelayToken();
      token.catch(() => {});
      await vi.advanceTimersByTimeAsync(3000);

      await expect(token).rejects.toThrow("aborted");
    });
  });
});

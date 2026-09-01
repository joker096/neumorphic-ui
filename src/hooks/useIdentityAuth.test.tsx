import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const masterKeyMock = vi.hoisted(() => ({
  hasMasterIdentity: vi.fn(async () => false),
  getMasterKeySet: vi.fn(async () => ({} as any)),
}));

vi.mock("../lib/identity/masterKey", () => masterKeyMock);
vi.mock("../lib/errorHandling", () => ({ logError: vi.fn() }));

import { logError } from "../lib/errorHandling";
import { useIdentityAuth } from "./useIdentityAuth";

beforeEach(() => {
  masterKeyMock.hasMasterIdentity.mockReset().mockResolvedValue(false);
  masterKeyMock.getMasterKeySet.mockReset().mockResolvedValue({} as any);
  (logError as any).mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const flush = () => new Promise((r) => setTimeout(r, 0));

describe("useIdentityAuth", () => {
  it("reports existing-user when a master identity exists", async () => {
    masterKeyMock.hasMasterIdentity.mockResolvedValue(true);
    const { result } = renderHook(() => useIdentityAuth());
    expect(result.current.status).toBe("loading");
    await flush();
    await waitFor(() => expect(result.current.status).toBe("existing-user"));
  });

  it("reports new-user when no identity and not in e2e mode", async () => {
    const { result } = renderHook(() => useIdentityAuth());
    await flush();
    await waitFor(() => expect(result.current.status).toBe("new-user"));
    expect(masterKeyMock.getMasterKeySet).not.toHaveBeenCalled();
  });

  it("bootstraps an identity in e2e mode and reports existing-user", async () => {
    vi.stubEnv("VITE_USE_MOCK", "true");
    const { result } = renderHook(() => useIdentityAuth());
    await flush();
    await waitFor(() => expect(result.current.status).toBe("existing-user"));
    expect(masterKeyMock.getMasterKeySet).toHaveBeenCalled();
  });

  it("falls back to new-user and logs an error when the check throws", async () => {
    masterKeyMock.hasMasterIdentity.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useIdentityAuth());
    await flush();
    await waitFor(() => expect(result.current.status).toBe("new-user"));
    expect(logError).toHaveBeenCalled();
  });
});

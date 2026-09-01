import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { getErrorStats, clearErrorLog } from "../lib/errorHandling";
import { useHealthCheck } from "./useHealthCheck";

vi.mock("../lib/errorHandling", () => ({
  getErrorStats: vi.fn(),
  clearErrorLog: vi.fn(),
}));

const mkget = (stats: Partial<ReturnType<typeof getErrorStats>>) =>
  ({ total: 0, critical: 0, major: 0, minor: 0, retryable: 0, ...stats });

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

describe("useHealthCheck", () => {
  it("healthy when no critical/major errors", async () => {
    (getErrorStats as any).mockReturnValue(mkget({ total: 7, minor: 7 }));
    const { result } = renderHook(() => useHealthCheck());
    expect(result.current.status).toBe("healthy");
    expect(result.current.stats.minor).toBe(7);
  });

  it("degraded when major errors present but within threshold", async () => {
    (getErrorStats as any).mockReturnValue(mkget({ major: 1, total: 1 }));
    const { result } = renderHook(() => useHealthCheck());
    expect(result.current.status).toBe("degraded");
  });

  it("unhealthy when critical exceeds 3", async () => {
    (getErrorStats as any).mockReturnValue(mkget({ critical: 4, total: 4 }));
    const { result } = renderHook(() => useHealthCheck());
    expect(result.current.status).toBe("unhealthy");
  });

  it("re-evaluates on the 10s interval", async () => {
    (getErrorStats as any).mockReturnValue(mkget({}));
    const { result } = renderHook(() => useHealthCheck());
    expect(result.current.status).toBe("healthy");
    (getErrorStats as any).mockReturnValue(mkget({ major: 6, total: 6 }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });
    expect(result.current.status).toBe("unhealthy");
  });

  it("clearErrors resets stats and reflects healthy", async () => {
    (getErrorStats as any).mockReturnValue(mkget({ major: 6, total: 6 }));
    const { result } = renderHook(() => useHealthCheck());
    expect(result.current.status).toBe("unhealthy");
    (getErrorStats as any).mockReturnValue(mkget({}));
    act(() => result.current.clearErrors());
    expect(clearErrorLog).toHaveBeenCalled();
    expect(result.current.status).toBe("healthy");
  });
});

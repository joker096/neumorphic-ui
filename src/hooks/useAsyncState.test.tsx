import { describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAsyncState } from "./useAsyncState";

describe("useAsyncState", () => {
  it("starts in loading state with null data and no error", () => {
    const { result } = renderHook(() => useAsyncState<string>());
    expect(result.current.status).toBe("loading");
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isEmpty).toBe(false);
  });

  it("setData marks loaded and stores the payload", () => {
    const { result } = renderHook(() => useAsyncState<string>());
    act(() => result.current.setData("hello"));
    expect(result.current.status).toBe("loaded");
    expect(result.current.data).toBe("hello");
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("setError marks error and stores message and code", () => {
    const { result } = renderHook(() => useAsyncState<string>());
    act(() => result.current.setError("boom", "E42"));
    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe("boom");
    expect(result.current.isLoading).toBe(false);
  });

  it("setEmpty clears data and marks empty", () => {
    const { result } = renderHook(() => useAsyncState<string>());
    act(() => result.current.setData("x"));
    act(() => result.current.setEmpty());
    expect(result.current.status).toBe("empty");
    expect(result.current.data).toBeNull();
    expect(result.current.isEmpty).toBe(true);
  });

  it("status shortcuts set the corresponding state", () => {
    const { result } = renderHook(() => useAsyncState<string>());
    act(() => result.current.setOffline());
    expect(result.current.status).toBe("offline");
    act(() => result.current.setUnauthorized());
    expect(result.current.status).toBe("unauthorized");
    act(() => result.current.setRestricted());
    expect(result.current.status).toBe("restricted");
    act(() => result.current.setDeleted());
    expect(result.current.status).toBe("deleted");
  });

  it("run resolves to data and marks loaded", async () => {
    const { result } = renderHook(() => useAsyncState<string>());
    await act(async () => {
      await result.current.run(async () => "val");
    });
    expect(result.current.status).toBe("loaded");
    expect(result.current.data).toBe("val");
  });

  it("run with isEmpty transition to empty", async () => {
    const { result } = renderHook(() => useAsyncState<string[]>());
    await act(async () => {
      await result.current.run(async () => [], { isEmpty: (arr) => arr.length === 0 });
    });
    expect(result.current.status).toBe("empty");
    expect(result.current.isEmpty).toBe(true);
  });

  it("run returns null and marks error on generic failure", async () => {
    const { result } = renderHook(() => useAsyncState<string>());
    let returned: string | null = "sentinel";
    await act(async () => {
      returned = await result.current.run(async () => {
        throw new Error("nope");
      });
    });
    expect(returned).toBeNull();
    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe("nope");
  });

  it("run maps offline / unauthorized / restricted / deleted by error name", async () => {
    const { result } = renderHook(() => useAsyncState<string>());
    const cases: Array<[string, string]> = [
      ["OfflineError", "offline"],
      ["UnauthorizedError", "unauthorized"],
      ["RestrictedError", "restricted"],
      ["DeletedError", "deleted"],
    ];
    for (const [name, expected] of cases) {
      const err = new Error("x") as any;
      err.name = name;
      await act(async () => {
        await result.current.run(async () => {
          throw err;
        });
      });
      expect(result.current.status).toBe(expected);
    }
  });

  it("run treats message containing 'offline' as offline", async () => {
    const { result } = renderHook(() => useAsyncState<string>());
    await act(async () => {
      await result.current.run(async () => {
        throw new Error("you are offline");
      });
    });
    expect(result.current.status).toBe("offline");
  });

  it("setError stores the error code via setError", () => {
    const { result } = renderHook(() => useAsyncState<string>());
    act(() => result.current.setError("bad", "X1"));
    expect(result.current.error).toBe("bad");
  });

  it("setLoading resets error and returns to loading", () => {
    const { result } = renderHook(() => useAsyncState<string>());
    act(() => result.current.setError("boom"));
    act(() => result.current.setLoading());
    expect(result.current.status).toBe("loading");
    expect(result.current.error).toBeNull();
  });
});

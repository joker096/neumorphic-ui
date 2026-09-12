import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";

const i18nMock = vi.hoisted(() => {
  const state = { lang: "en", setLang: vi.fn(), t: (k: string) => k };
  return state;
});

vi.mock("../lib/i18n", () => ({
  useI18n: () => ({
    t: i18nMock.t,
    setLang: i18nMock.setLang,
    lang: i18nMock.lang,
  }),
}));

import { useAppSettings } from "./useAppSettings";

beforeEach(() => {
  localStorage.clear();
  i18nMock.setLang.mockClear();
});

describe("useAppSettings", () => {
  it("defaults theme to dark when nothing persisted", () => {
    const { result } = renderHook(() => useAppSettings());
    expect(result.current.theme).toBe("dark");
    expect(result.current.isDark).toBe(true);
  });

  it("reads a persisted light theme", () => {
    localStorage.setItem("app_theme", "light");
    const { result } = renderHook(() => useAppSettings());
    expect(result.current.theme).toBe("light");
    expect(result.current.isDark).toBe(false);
  });

  it("falls back to dark for invalid persisted theme", () => {
    localStorage.setItem("app_theme", "neon");
    const { result } = renderHook(() => useAppSettings());
    expect(result.current.theme).toBe("dark");
  });

  it("setTheme updates theme and mirrors onto documentElement", () => {
    const { result } = renderHook(() => useAppSettings());
    act(() => result.current.setTheme("light"));
    expect(result.current.theme).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("passes language through and exposes setLanguage", () => {
    const { result } = renderHook(() => useAppSettings());
    expect(result.current.language).toBe("en");
    result.current.setLanguage("ru");
    expect(i18nMock.setLang).toHaveBeenCalledWith("ru");
  });

  it("defaults fontSize to Medium and persists on change", () => {
    const { result } = renderHook(() => useAppSettings());
    expect(result.current.fontSize).toBe("Medium");
    act(() => result.current.setFontSize("Large"));
    expect(localStorage.getItem("app_font_size")).toBe("Large");
    expect(result.current.fontSize).toBe("Large");
  });

  it("mirrors fontSize onto documentElement so the CSS override resolves", () => {
    const { result } = renderHook(() => useAppSettings());
    expect(document.documentElement.dataset.fontSize).toBe("Medium");
    act(() => result.current.setFontSize("Small"));
    expect(document.documentElement.dataset.fontSize).toBe("Small");
    act(() => result.current.setFontSize("Large"));
    expect(document.documentElement.dataset.fontSize).toBe("Large");
  });

  it("reads a persisted fontSize and ignores invalid values", () => {
    localStorage.setItem("app_font_size", "Small");
    const { result } = renderHook(() => useAppSettings());
    expect(result.current.fontSize).toBe("Small");
    localStorage.setItem("app_font_size", "Huge");
    const { result: r2 } = renderHook(() => useAppSettings());
    expect(r2.current.fontSize).toBe("Medium");
  });
});

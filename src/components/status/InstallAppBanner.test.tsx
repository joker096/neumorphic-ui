import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { InstallAppBanner } from "./InstallAppBanner";
import { useInstallPrompt } from "../../hooks/useInstallPrompt";
import { STORAGE_KEYS } from "../../constants/storage";

vi.mock("../../hooks/useInstallPrompt", () => ({
  useInstallPrompt: vi.fn(),
}));

const t = (k: string, f?: string) => f ?? k;
const mockHook = useInstallPrompt as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  window.localStorage.clear();
  mockHook.mockReturnValue({ canInstall: true, isStandalone: false, promptInstall: vi.fn() });
});

afterEach(() => {
  vi.clearAllMocks();
  cleanup();
});

describe("InstallAppBanner", () => {
  it("is hidden when the browser cannot offer install", () => {
    mockHook.mockReturnValue({ canInstall: false, isStandalone: false, promptInstall: vi.fn() });
    render(<InstallAppBanner t={t} />);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("is hidden when already running standalone", () => {
    mockHook.mockReturnValue({ canInstall: true, isStandalone: true, promptInstall: vi.fn() });
    render(<InstallAppBanner t={t} />);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("is hidden once dismissed", () => {
    window.localStorage.setItem(STORAGE_KEYS.PWA_INSTALL_DISMISSED, "true");
    render(<InstallAppBanner t={t} />);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("offers install and calls the deferred prompt", () => {
    const promptInstall = vi.fn();
    mockHook.mockReturnValue({ canInstall: true, isStandalone: false, promptInstall });
    render(<InstallAppBanner t={t} />);
    expect(screen.getByRole("status")).toHaveTextContent("Install the app");
    fireEvent.click(screen.getByRole("button", { name: "Install" }));
    expect(promptInstall).toHaveBeenCalledOnce();
  });

  it("persists dismissal on close", () => {
    render(<InstallAppBanner t={t} />);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss install hint" }));
    expect(window.localStorage.getItem(STORAGE_KEYS.PWA_INSTALL_DISMISSED)).toBe("true");
  });
});

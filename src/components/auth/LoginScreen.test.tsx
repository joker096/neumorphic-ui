import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const recovery = vi.hoisted(() => ({
  restoreFromPhrase: vi.fn(),
}));

const cryptoMock = vi.hoisted(() => ({
  hashAppLockPIN: vi.fn(),
  buf2hex: vi.fn(),
}));

const store = vi.hoisted(() => ({
  setAppLock: vi.fn(),
}));

vi.mock("lucide-react", () => ({
  ChevronLeft: () => null,
  Undo: () => null,
  ArrowRight: () => null,
  LogIn: () => null,
  Shield: () => null,
  Check: () => null,
}));

vi.mock("../../lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string | Record<string, unknown>) =>
      typeof fallback === "string" ? fallback : key,
  }),
}));

vi.mock("../../lib/recovery/RecoveryManager", () => ({
  RecoveryManager: {
    restoreFromPhrase: recovery.restoreFromPhrase,
  },
}));

vi.mock("../../lib/crypto/cryptoCore", () => ({
  cryptoCore: {
    hashAppLockPIN: cryptoMock.hashAppLockPIN,
  },
  buf2hex: cryptoMock.buf2hex,
}));

vi.mock("../../store", () => ({
  useAppStore: (selector: (state: { setAppLock: typeof store.setAppLock }) => any) =>
    selector({ setAppLock: store.setAppLock }),
}));

import { LoginScreen } from "./LoginScreen";
import { STORAGE_KEYS } from "../../constants/storage";

const twelveWords = Array.from({ length: 12 }, (_, i) => `word${i + 1}`).join(" ");

async function goToPinStep(onComplete: () => void) {
  recovery.restoreFromPhrase.mockResolvedValue(true);
  const onCompleteRef = { current: onComplete };
  render(<LoginScreen onComplete={() => onCompleteRef.current()} />);
  fireEvent.change(screen.getByPlaceholderText("word1 word2 word3 ..."), {
    target: { value: twelveWords },
  });
  fireEvent.click(screen.getByRole("button", { name: "Restore Identity" }));
  await waitFor(() =>
    expect(screen.getByRole("heading", { name: "Set App Lock PIN" })).toBeInTheDocument(),
  );
  return onCompleteRef.current;
}

describe("LoginScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    recovery.restoreFromPhrase.mockReset();
    cryptoMock.hashAppLockPIN.mockReset();
    cryptoMock.buf2hex.mockReset();
    store.setAppLock.mockClear();
    cryptoMock.buf2hex.mockReturnValue("salt-hex");
    cryptoMock.hashAppLockPIN.mockResolvedValue({ hash: "hashed", saltHex: "salt-hex" });
  });

  it("renders recovery phrase step", () => {
    render(<LoginScreen onComplete={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Restore Identity" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("word1 word2 word3 ...")).toBeInTheDocument();
  });

  it("shows back button and calls onBack", () => {
    const onBack = vi.fn();
    render(<LoginScreen onComplete={vi.fn()} onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("disables restore until phrase has at least 12 words", () => {
    render(<LoginScreen onComplete={vi.fn()} />);
    const button = screen.getByRole("button", { name: "Restore Identity" });
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("word1 word2 word3 ..."), {
      target: { value: "only eleven words here are present in this input" },
    });
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("word1 word2 word3 ..."), {
      target: { value: twelveWords },
    });
    expect(button).not.toBeDisabled();
  });

  it("advances to PIN step after successful restore", async () => {
    const onComplete = vi.fn();
    await goToPinStep(onComplete);
    expect(recovery.restoreFromPhrase).toHaveBeenCalledWith(twelveWords);
  });

  it("shows phrase error when restore fails", async () => {
    recovery.restoreFromPhrase.mockResolvedValue(false);
    render(<LoginScreen onComplete={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("word1 word2 word3 ..."), {
      target: { value: twelveWords },
    });
    fireEvent.click(screen.getByRole("button", { name: "Restore Identity" }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Invalid recovery phrase. Please check and try again.",
      ),
    );
  });

  it("shows restore error when restore throws", async () => {
    recovery.restoreFromPhrase.mockRejectedValue(new Error("restore"));
    render(<LoginScreen onComplete={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("word1 word2 word3 ..."), {
      target: { value: twelveWords },
    });
    fireEvent.click(screen.getByRole("button", { name: "Restore Identity" }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "An error occurred during restoration. Please try again.",
      ),
    );
  });

  it("shows restoring spinner while phrase is restored", async () => {
    let resolveRestore!: (value: boolean) => void;
    recovery.restoreFromPhrase.mockImplementationOnce(
      () => new Promise<boolean>((resolve) => { resolveRestore = resolve; }),
    );
    render(<LoginScreen onComplete={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("word1 word2 word3 ..."), {
      target: { value: twelveWords },
    });
    fireEvent.click(screen.getByRole("button", { name: "Restore Identity" }));
    expect(screen.getByText("Restoring...")).toBeInTheDocument();
    resolveRestore!(true);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Set App Lock PIN" })).toBeInTheDocument(),
    );
  });

  it("returns to phrase entry when restore fails (not stuck on spinner)", async () => {
    recovery.restoreFromPhrase.mockResolvedValue(false);
    render(<LoginScreen onComplete={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("word1 word2 word3 ..."), {
      target: { value: twelveWords },
    });
    fireEvent.click(screen.getByRole("button", { name: "Restore Identity" }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Invalid recovery phrase. Please check and try again.",
      ),
    );
    expect(screen.getByRole("heading", { name: "Restore Identity" })).toBeInTheDocument();
    expect(screen.queryByText("Restoring...")).not.toBeInTheDocument();
  });

  it("hashes PIN and stores app lock when PINs match", async () => {
    const onComplete = vi.fn();
    await goToPinStep(onComplete);

    const pinInput = screen.getByPlaceholderText("Enter PIN (4-6 digits)");
    const confirmInput = screen.getByPlaceholderText("Confirm PIN");
    const continueButton = screen.getByRole("button", { name: "Continue" });
    expect(continueButton).toBeDisabled();

    fireEvent.change(pinInput, { target: { value: "123" } });
    expect(continueButton).toBeDisabled();

    fireEvent.change(pinInput, { target: { value: "1234" } });
    fireEvent.change(confirmInput, { target: { value: "1234" } });
    fireEvent.click(continueButton);

    await waitFor(() =>
      expect(store.setAppLock).toHaveBeenCalledWith("hashed", "salt-hex"),
    );
    expect(screen.getByRole("heading", { name: "Identity Restored" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Enter App" }));
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("shows PIN mismatch without storing app lock", async () => {
    await goToPinStep(vi.fn());
    fireEvent.change(screen.getByPlaceholderText("Enter PIN (4-6 digits)"), {
      target: { value: "1234" },
    });
    fireEvent.change(screen.getByPlaceholderText("Confirm PIN"), {
      target: { value: "5678" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "PINs must match and be 4-6 digits.",
      ),
    );
    expect(store.setAppLock).not.toHaveBeenCalled();
  });

  it("shows PIN error when hashing fails", async () => {
    cryptoMock.hashAppLockPIN.mockRejectedValueOnce(new Error("crypto"));
    await goToPinStep(vi.fn());
    fireEvent.change(screen.getByPlaceholderText("Enter PIN (4-6 digits)"), {
      target: { value: "1234" },
    });
    fireEvent.change(screen.getByPlaceholderText("Confirm PIN"), {
      target: { value: "1234" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Failed to set PIN. Please try again.",
      ),
    );
    expect(store.setAppLock).not.toHaveBeenCalled();
  });

  it("skips PIN setup and completes without storing app lock", async () => {
    const onComplete = vi.fn();
    await goToPinStep(onComplete);
    fireEvent.click(screen.getByRole("button", { name: "Skip PIN Setup" }));
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Identity Restored" })).toBeInTheDocument(),
    );
    expect(store.setAppLock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Enter App" }));
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("shows lock state instead of PIN inputs when locked", async () => {
    localStorage.setItem(
      STORAGE_KEYS.LOCK_BLOCKED_UNTIL,
      String(Date.now() + 120_000),
    );
    await goToPinStep(vi.fn());
    await waitFor(() => expect(screen.getByText("Locked")).toBeInTheDocument());
    expect(
      screen.queryByPlaceholderText("Enter PIN (4-6 digits)"),
    ).not.toBeInTheDocument();
  });
});

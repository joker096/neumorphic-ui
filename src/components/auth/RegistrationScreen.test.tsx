import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const recovery = vi.hoisted(() => ({
  generateRecoveryPhrase: vi.fn(),
}));

const cryptoMock = vi.hoisted(() => ({
  hashAppLockPIN: vi.fn(),
  buf2hex: vi.fn(),
}));

const store = vi.hoisted(() => ({
  setAppLock: vi.fn(),
}));

vi.mock("lucide-react", () => ({
  UserPlus: () => null,
  Copy: () => null,
  Check: () => null,
  ArrowRight: () => null,
  LogIn: () => null,
  Shield: () => null,
}));

vi.mock("../../lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string | Record<string, unknown>) =>
      typeof fallback === "string" ? fallback : key,
  }),
}));

vi.mock("../../lib/recovery/RecoveryManager", () => ({
  RecoveryManager: {
    generateRecoveryPhrase: recovery.generateRecoveryPhrase,
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

import { RegistrationScreen } from "./RegistrationScreen";

const phrase = Array.from({ length: 24 }, (_, i) => `word${i + 1}`).join(" ");
const otherPhrase = Array.from({ length: 24 }, (_, i) => `other${i + 1}`).join(" ");

async function goToShowPhrase(onComplete: () => void) {
  recovery.generateRecoveryPhrase.mockResolvedValue({ phrase });
  render(<RegistrationScreen onComplete={onComplete} />);
  fireEvent.click(screen.getByRole("button", { name: "Create Identity" }));
  await waitFor(() =>
    expect(screen.getByRole("heading", { name: "Recovery Phrase" })).toBeInTheDocument(),
  );
}

async function goToConfirmStep(onComplete: () => void) {
  await goToShowPhrase(onComplete);
  fireEvent.click(screen.getByRole("button", { name: "I've Written It Down" }));
  await waitFor(() =>
    expect(screen.getByRole("heading", { name: "Confirm Recovery Phrase" })).toBeInTheDocument(),
  );
}

async function goToPinStep(onComplete: () => void) {
  await goToConfirmStep(onComplete);
  fireEvent.change(screen.getByPlaceholderText("word1 word2 word3 ..."), {
    target: { value: phrase },
  });
  fireEvent.click(screen.getByRole("button", { name: "Verify Phrase" }));
  await waitFor(() =>
    expect(screen.getByRole("heading", { name: "Set App Lock PIN" })).toBeInTheDocument(),
  );
}

describe("RegistrationScreen", () => {
  let clipboardWrite: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    recovery.generateRecoveryPhrase.mockReset();
    cryptoMock.hashAppLockPIN.mockReset();
    cryptoMock.buf2hex.mockReset();
    store.setAppLock.mockClear();
    cryptoMock.buf2hex.mockReturnValue("salt-hex");
    cryptoMock.hashAppLockPIN.mockResolvedValue({ hash: "hashed", saltHex: "salt-hex" });
    clipboardWrite = vi.fn(() => Promise.resolve());
    vi.stubGlobal("navigator", { clipboard: { writeText: clipboardWrite } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders welcome step", () => {
    render(<RegistrationScreen onComplete={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Create Your Identity" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create Identity" }),
    ).not.toBeDisabled();
  });

  it("shows generated phrase after creation", async () => {
    await goToShowPhrase(vi.fn());
    expect(screen.getByText("word1")).toBeInTheDocument();
    expect(screen.getByText("word24")).toBeInTheDocument();
    expect(recovery.generateRecoveryPhrase).toHaveBeenCalledOnce();
  });

  it("copies phrase to clipboard", async () => {
    await goToShowPhrase(vi.fn());
    fireEvent.click(screen.getByRole("button", { name: "Copy to Clipboard" }));
    await waitFor(() =>
      expect(clipboardWrite).toHaveBeenCalledWith(phrase),
    );
  });

  it("shows generation error", async () => {
    recovery.generateRecoveryPhrase.mockRejectedValue(new Error("generate"));
    render(<RegistrationScreen onComplete={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Create Identity" }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Failed to generate identity. Please try again.",
      ),
    );
  });

  it("disables verify until 24 words are entered", async () => {
    await goToConfirmStep(vi.fn());
    const textarea = screen.getByPlaceholderText("word1 word2 word3 ...");
    const verifyButton = screen.getByRole("button", { name: "Verify Phrase" });
    expect(verifyButton).toBeDisabled();

    fireEvent.change(textarea, {
      target: { value: Array.from({ length: 23 }, (_, i) => `word${i + 1}`).join(" ") },
    });
    expect(verifyButton).toBeDisabled();

    fireEvent.change(textarea, { target: { value: phrase } });
    expect(verifyButton).not.toBeDisabled();
  });

  it("clears input and shows mismatch error", async () => {
    await goToConfirmStep(vi.fn());
    fireEvent.change(screen.getByPlaceholderText("word1 word2 word3 ..."), {
      target: { value: otherPhrase },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verify Phrase" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "The phrase doesn't match. Please check and try again.",
      ),
    );
    expect(screen.getByPlaceholderText("word1 word2 word3 ...")).toHaveValue("");
  });

  it("advances to PIN step after matching phrase", async () => {
    await goToPinStep(vi.fn());
    expect(screen.getByPlaceholderText("Enter PIN (4-6 digits)")).toBeInTheDocument();
  });

  it("hashes PIN and stores app lock when PINs match", async () => {
    const onComplete = vi.fn();
    await goToPinStep(onComplete);

    fireEvent.change(screen.getByPlaceholderText("Enter PIN (4-6 digits)"), {
      target: { value: "4321" },
    });
    fireEvent.change(screen.getByPlaceholderText("Confirm PIN"), {
      target: { value: "4321" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() =>
      expect(store.setAppLock).toHaveBeenCalledWith("hashed", "salt-hex"),
    );
    expect(screen.getByRole("heading", { name: "Identity Created" })).toBeInTheDocument();

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

  it("skips PIN setup and completes without storing app lock", async () => {
    const onComplete = vi.fn();
    await goToPinStep(onComplete);
    fireEvent.click(screen.getByRole("button", { name: "Skip PIN Setup" }));
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Identity Created" })).toBeInTheDocument(),
    );
    expect(store.setAppLock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Enter App" }));
    expect(onComplete).toHaveBeenCalledOnce();
  });
});

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const identity = vi.hoisted(() => ({
  status: "loading" as "loading" | "new-user" | "existing-user",
}));

const recheckMock = vi.hoisted(() => vi.fn());

const lock = vi.hoisted(() => ({
  pinInput: "",
  setPinInput: vi.fn(),
  pinError: false,
  biometricError: false,
  biometricBusy: false,
  biometricAvailable: false,
  lockAttempts: 0,
  lockBlockedUntil: undefined as number | undefined,
  lockBlockTimer: 0,
  handleUnlock: vi.fn(),
  handleUnlockBiometric: vi.fn(),
  isLocked: false,
}));

const storeState = vi.hoisted(() => ({
  appLockBiometricEnabled: false,
}));

const authCapture = vi.hoisted(() => ({
  registration: null as any,
  login: null as any,
}));

const lockCapture = vi.hoisted(() => ({
  lock: null as any,
}));

vi.mock("../../hooks/useIdentityAuth", () => ({
  useIdentityAuth: () => ({ status: identity.status, recheck: recheckMock }),
}));

vi.mock("../../hooks/useAppLock", () => ({
  useAppLock: () => lock,
}));

vi.mock("../../store", () => ({
  useAppStore: (selector: (state: { appLockBiometricEnabled: boolean }) => any) =>
    selector(storeState),
}));

vi.mock("../auth/RegistrationScreen", () => ({
  RegistrationScreen: (props: any) => {
    authCapture.registration = props;
    return React.createElement("div", { "data-testid": "registration-screen" });
  },
}));

vi.mock("../auth/LoginScreen", () => ({
  LoginScreen: (props: any) => {
    authCapture.login = props;
    return React.createElement("div", { "data-testid": "login-screen" });
  },
}));

vi.mock("./AppLockScreen", () => ({
  AppLockScreen: (props: any) => {
    lockCapture.lock = props;
    return React.createElement("div", { "data-testid": "app-lock-screen" });
  },
}));

import { AppAuthGate } from "./AppAuthGate";

describe("AppAuthGate", () => {
  beforeEach(() => {
    identity.status = "loading";
    lock.pinInput = "";
    lock.setPinInput = vi.fn();
    lock.pinError = false;
    lock.biometricError = false;
    lock.biometricBusy = false;
    lock.biometricAvailable = false;
    lock.lockAttempts = 0;
    lock.lockBlockedUntil = undefined;
    lock.lockBlockTimer = 0;
    lock.handleUnlock = vi.fn();
    lock.handleUnlockBiometric = vi.fn();
    lock.isLocked = false;
    storeState.appLockBiometricEnabled = false;
    recheckMock.mockClear();
    authCapture.registration = null;
    authCapture.login = null;
    lockCapture.lock = null;
  });

  it("renders loading spinner while identity status is loading", () => {
    const { container } = render(
      <AppAuthGate>
        <div>child</div>
      </AppAuthGate>,
    );
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders registration screen for new user and rechecks identity on completion", async () => {
    identity.status = "new-user";
    render(
      <AppAuthGate>
        <div>child</div>
      </AppAuthGate>,
    );
    expect(await screen.findByTestId("registration-screen")).toBeInTheDocument();
    authCapture.registration.onComplete();
    expect(recheckMock).toHaveBeenCalledOnce();
  });

  it("renders children for unlocked existing user", () => {
    identity.status = "existing-user";
    render(
      <AppAuthGate>
        <div>child</div>
      </AppAuthGate>,
    );
    expect(screen.getByText("child")).toBeInTheDocument();
  });

  it("renders lock screen for locked existing user and passes lock props", () => {
    identity.status = "existing-user";
    lock.isLocked = true;
    lock.handleUnlock = vi.fn();
    lock.handleUnlockBiometric = vi.fn();
    storeState.appLockBiometricEnabled = true;

    render(
      <AppAuthGate>
        <div>child</div>
      </AppAuthGate>,
    );

    expect(screen.getByTestId("app-lock-screen")).toBeInTheDocument();
    expect(lockCapture.lock).toMatchObject({
      pinInput: lock.pinInput,
      pinError: lock.pinError,
      biometricError: lock.biometricError,
      biometricBusy: lock.biometricBusy,
      biometricAvailable: lock.biometricAvailable,
      biometricEnabled: true,
      lockAttempts: lock.lockAttempts,
      lockBlockTimer: lock.lockBlockTimer,
      lockBlockedUntil: lock.lockBlockedUntil,
    });
    expect(lockCapture.lock.handleUnlock).toBe(lock.handleUnlock);
    expect(lockCapture.lock.handleUnlockBiometric).toBe(lock.handleUnlockBiometric);
  });

  it("shows login after show-login event and returns to children on back", async () => {
    identity.status = "existing-user";
    render(
      <AppAuthGate>
        <div>child</div>
      </AppAuthGate>,
    );

    window.dispatchEvent(new Event("show-login"));
    await waitFor(() =>
      expect(screen.getByTestId("login-screen")).toBeInTheDocument(),
    );
    expect(screen.queryByText("child")).not.toBeInTheDocument();

    authCapture.login.onBack();
    await waitFor(() => expect(screen.getByText("child")).toBeInTheDocument());
    expect(recheckMock).not.toHaveBeenCalled();
  });

  it("completes login after show-login event", async () => {
    identity.status = "existing-user";
    render(
      <AppAuthGate>
        <div>child</div>
      </AppAuthGate>,
    );

    window.dispatchEvent(new Event("show-login"));
    await waitFor(() =>
      expect(screen.getByTestId("login-screen")).toBeInTheDocument(),
    );

    authCapture.login.onComplete();
    await waitFor(() => expect(screen.getByText("child")).toBeInTheDocument());
    expect(recheckMock).not.toHaveBeenCalled();
  });
});

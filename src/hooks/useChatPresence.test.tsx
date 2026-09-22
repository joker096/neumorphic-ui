import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";

const netMock = vi.hoisted(() => ({
  onConnection: vi.fn(),
  onDisconnection: vi.fn(),
  onPresence: vi.fn(),
  sendPresenceSignal: vi.fn(),
  getPeers: vi.fn(() => []),
  peerForChat: vi.fn(() => undefined),
  peerForChatName: vi.fn(() => undefined),
}));

const stateMock = vi.hoisted(() => ({
  chats: [] as any[],
  onlineStatus: true,
  setChats: vi.fn(),
}));

vi.mock("../lib/p2p/network", () => ({ p2pNetwork: netMock }));
vi.mock("../store", () => ({
  useAppStore: Object.assign((sel: any) => sel(stateMock), { getState: () => stateMock }),
}));

import { useChatPresence } from "./useChatPresence";

const applyUpdater = (updater: any) => {
  const next = typeof updater === "function" ? updater(stateMock.chats) : updater;
  stateMock.chats = next;
  return next;
};

beforeEach(() => {
  netMock.onConnection.mockReset().mockReturnValue(() => {});
  netMock.onDisconnection.mockReset().mockReturnValue(() => {});
  netMock.onPresence.mockReset().mockReturnValue(() => {});
  netMock.sendPresenceSignal.mockReset();
  netMock.getPeers.mockReset().mockReturnValue([]);
  netMock.peerForChat.mockReset().mockReturnValue(undefined);
  netMock.peerForChatName.mockReset().mockReturnValue(undefined);
  stateMock.chats = [{ id: 1, name: "Alice", online: false }];
  stateMock.setChats.mockReset().mockImplementation(applyUpdater);
});

afterEach(() => {
  stateMock.chats = [];
});

const captureCallback = (fn: any) => {
  const captured: any[] = [];
  fn.mockImplementation((cb: any) => {
    captured.push(cb);
    return () => {};
  });
  return captured;
};

describe("useChatPresence", () => {
  it("subscribes to connection, disconnection and presence events", () => {
    renderHook(() => useChatPresence());
    expect(netMock.onConnection).toHaveBeenCalled();
    expect(netMock.onDisconnection).toHaveBeenCalled();
    expect(netMock.onPresence).toHaveBeenCalled();
  });

  it("marks a chat online when its bound peer connects and broadcasts own presence", () => {
    netMock.peerForChat.mockReturnValue("peer1");
    const connCbs = captureCallback(netMock.onConnection);
    renderHook(() => useChatPresence());

    actCall(connCbs[0], "peer1");

    expect(netMock.sendPresenceSignal).toHaveBeenCalledWith(true);
    expect(stateMock.chats[0]).toMatchObject({ id: 1, online: true });
  });

  it("marks chats offline with lastSeen on peer disconnect", () => {
    netMock.peerForChatName.mockReturnValue("peer1");
    const connCbs = captureCallback(netMock.onConnection);
    const discCbs = captureCallback(netMock.onDisconnection);
    renderHook(() => useChatPresence());

    actCall(connCbs[0], "peer1");
    actCall(discCbs[0], "peer1");

    expect(stateMock.chats[0]).toMatchObject({ id: 1, online: false });
    expect(stateMock.chats[0].lastSeen).toBeTypeOf("number");
  });

  it("honours inbound online-status signals from peers", () => {
    netMock.peerForChat.mockReturnValue("peer1");
    const presenceCbs = captureCallback(netMock.onPresence);
    renderHook(() => useChatPresence());

    actCall(presenceCbs[0], "peer1", true);
    expect(stateMock.chats[0]).toMatchObject({ id: 1, online: true });
  });

  it("snapshots already-connected peers on mount", () => {
    netMock.peerForChat.mockReturnValue("peer1");
    netMock.getPeers.mockReturnValue([{ peerId: "peer1", connected: true }]);
    renderHook(() => useChatPresence());

    expect(stateMock.chats[0]).toMatchObject({ id: 1, online: true });
  });

  it("skips broadcasting own presence when onlineStatus is off", () => {
    stateMock.onlineStatus = false;
    netMock.peerForChat.mockReturnValue("peer1");
    const connCbs = captureCallback(netMock.onConnection);
    renderHook(() => useChatPresence());

    actCall(connCbs[0], "peer1");

    expect(netMock.sendPresenceSignal).not.toHaveBeenCalled();
    expect(stateMock.chats[0]).toMatchObject({ id: 1, online: true });
  });

  it("ignores peers not bound to any chat", () => {
    const connCbs = captureCallback(netMock.onConnection);
    renderHook(() => useChatPresence());

    actCall(connCbs[0], "unknown-peer");

    expect(stateMock.setChats).not.toHaveBeenCalled();
  });
});

const actCall = (cb: any, ...args: any[]) => cb?.(...args);
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { TeamInbox } from "./TeamInbox";
import type { CompanyChannel, CompanyMessage } from "../../types/constants";

const toastSuccess = vi.hoisted(() => vi.fn());
const toastError = vi.hoisted(() => vi.fn());
const relayClientMock = vi.hoisted(() => vi.fn());

const store = vi.hoisted(() => ({
  companyChannels: [] as any[],
  activeChannelId: null as string | null,
  companyMessages: [] as any[],
  userProfile: { id: "u1", name: "Alice" },
  companyId: null as string | null,
  siteChats: [] as any[],
  channelKeys: {} as Record<string, any>,
  setActiveChannel: vi.fn(),
  addCompanyMessage: vi.fn(),
  syncCrmOutbound: vi.fn(),
}));

vi.mock("../../store", () => ({
  useAppStore: (selector: any) => selector(store),
}));

vi.mock("../../lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string | Record<string, string | number>) =>
      fallback && typeof fallback === "object"
        ? key.replace(/\{(\w+)\}/g, (_, name: string) => String(fallback[name] ?? ""))
        : ((fallback ?? key) as string),
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: toastSuccess, error: toastError },
}));

vi.mock("../../lib/company/relayClient", () => ({
  RelayClient: relayClientMock,
}));

const channel: CompanyChannel = {
  id: "ch1",
  companyId: "org_1",
  name: "General",
  description: "Team chat",
  unread: 0,
  memberCount: 2,
  createdAt: 0,
};

describe("TeamInbox", () => {
  beforeEach(() => {
    store.companyChannels = [];
    store.activeChannelId = null;
    store.companyMessages = [];
    store.companyId = null;
    store.siteChats = [];
    store.channelKeys = {};
    store.setActiveChannel.mockReset();
    store.addCompanyMessage.mockReset();
    store.syncCrmOutbound.mockReset();
    relayClientMock.mockImplementation(function () {
      return { onMessage: vi.fn(), start: vi.fn(), stop: vi.fn(), publish: vi.fn() };
    });
    relayClientMock.mockClear();
    toastSuccess.mockClear();
    toastError.mockClear();
  });

  it("shows the empty state when there are no channels", () => {
    render(<TeamInbox />);
    expect(screen.getByText("No team channels yet")).toBeInTheDocument();
  });

  it("renders the active channel with the empty thread and channel switching", () => {
    store.companyChannels = [channel];
    store.activeChannelId = "ch1";
    render(<TeamInbox />);

    expect(screen.getAllByText("General")).toHaveLength(2);
    expect(screen.getAllByText("Team chat")).toHaveLength(2);
    expect(screen.getByText("No messages yet — start the conversation")).toBeInTheDocument();

    fireEvent.click(screen.getAllByText("General")[0]);
    expect(store.setActiveChannel).toHaveBeenCalledWith("ch1");
  });

  it("sends a message with the send button and clears the draft", () => {
    store.companyChannels = [channel];
    store.activeChannelId = "ch1";
    render(<TeamInbox />);

    const input = screen.getByPlaceholderText("Type a message…");
    fireEvent.change(input, { target: { value: "Hello team" } });
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[buttons.length - 1]);

    expect(store.addCompanyMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        channelId: "ch1",
        senderId: "u1",
        senderName: "Alice",
        text: "Hello team",
        status: "sent",
      }),
    );
    expect(input).toHaveValue("");
  });

  it("send button has min-h-11 touch zone", () => {
    store.companyChannels = [channel];
    store.activeChannelId = "ch1";
    render(<TeamInbox />);

    const buttons = screen.getAllByRole("button");
    expect(buttons[buttons.length - 1].className).toContain("min-h-11");
  });

  it("sends on Enter in the input", () => {
    store.companyChannels = [channel];
    store.activeChannelId = "ch1";
    render(<TeamInbox />);

    const input = screen.getByPlaceholderText("Type a message…");
    fireEvent.change(input, { target: { value: "Quick note" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(store.addCompanyMessage).toHaveBeenCalledWith(
      expect.objectContaining({ text: "Quick note", status: "sent" }),
    );
  });

  it("does not send a blank draft", () => {
    store.companyChannels = [channel];
    store.activeChannelId = "ch1";
    render(<TeamInbox />);

    const input = screen.getByPlaceholderText("Type a message…");
    fireEvent.change(input, { target: { value: "   " } });
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[buttons.length - 1]);

    expect(store.addCompanyMessage).not.toHaveBeenCalled();
  });

  it("renders incoming messages with the sender name and own messages without it", () => {
    store.companyChannels = [channel];
    store.activeChannelId = "ch1";
    const incoming: CompanyMessage = {
      id: "m1",
      channelId: "ch1",
      senderId: "u2",
      senderName: "Bob",
      text: "Hi from Bob",
      timestamp: 1000,
      status: "delivered",
    };
    const own: CompanyMessage = {
      id: "m2",
      channelId: "ch1",
      senderId: "u1",
      senderName: "Alice",
      text: "Hi back",
      timestamp: 2000,
      status: "sent",
    };
    store.companyMessages = [incoming, own];
    render(<TeamInbox />);

    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Hi from Bob")).toBeInTheDocument();
    expect(screen.getByText("Hi back")).toBeInTheDocument();
    expect(screen.queryByText("Alice")).toBeNull();
  });

  it("shows a success toast when CRM sync succeeds", async () => {
    store.companyChannels = [channel];
    store.activeChannelId = "ch1";
    store.syncCrmOutbound.mockResolvedValue({ ok: true });
    render(<TeamInbox />);

    fireEvent.click(screen.getByRole("button", { name: /Sync CRM/ }));
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith("CRM snapshot encrypted & shared with team"),
    );
  });

  it("shows an error toast when CRM sync has no group key", async () => {
    store.companyChannels = [channel];
    store.activeChannelId = "ch1";
    store.syncCrmOutbound.mockResolvedValue({ ok: false });
    render(<TeamInbox />);

    fireEvent.click(screen.getByRole("button", { name: /Sync CRM/ }));
    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("No group key — create or join a company first"),
    );
  });

  it("starts a relay client for a site chat and shows the live badge", () => {
    const siteChannel: CompanyChannel = {
      id: "sc1",
      companyId: "org_1",
      name: "Sales Chat",
      description: "",
      unread: 0,
      memberCount: 1,
      createdAt: 0,
    };
    store.companyChannels = [siteChannel];
    store.activeChannelId = "sc1";
    store.companyId = "org_1";
    store.siteChats = [{ id: "sc1", name: "Sales Chat", snippet: "" }];
    store.channelKeys = { sc1: { publicKeyB64: "pk", secretKeyB64: "sk" } };
    render(<TeamInbox />);

    expect(screen.getByText("Website embed · E2E encrypted")).toBeInTheDocument();
    expect(relayClientMock).toHaveBeenCalledWith("company:org_1:channel:sc1");
  });
});

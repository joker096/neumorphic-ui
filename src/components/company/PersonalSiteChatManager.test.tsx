import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { PersonalSiteChatManager } from "./PersonalSiteChatManager";
import { usePersonalSiteChatStore } from "../../store/personalSiteChat";

vi.mock("../../lib/idb", () => ({
  set: vi.fn(() => Promise.resolve(undefined)),
  get: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("../../lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string) => (fallback ?? key) as string,
    lang: "en",
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const { mockPremium, relayPublished } = vi.hoisted(() => ({
  mockPremium: { value: false },
  relayPublished: vi.fn(),
}));

vi.mock("../../lib/company/relayClient", () => ({
  RelayClient: class {
    topic: string;
    onStatusCb?: (s: string) => void;
    constructor(topic: string) {
      this.topic = topic;
    }
    onStatus(cb: (s: string) => void) {
      this.onStatusCb = cb;
    }
    onMessage() {}
    start() {
      this.onStatusCb?.("online");
    }
    stop() {}
    publish(sealed: unknown) {
      relayPublished(sealed);
      return true;
    }
    isOnline() {
      return true;
    }
  },
}));

vi.mock("../../lib/embed/embedCrypto", () => ({
  openFromChannel: vi.fn(async () => "{}"),
  sealToGuest: vi.fn(async () => ({ senderPubKey: "P2", cipher: "C", iv: "I" })),
  generateChannelKeyPair: vi.fn(() => ({ publicKeyB64: "P", secretKeyB64: "S" })),
  makeGuestIdentity: vi.fn(() => ({ publicKey: new Uint8Array(32), secretKey: new Uint8Array(32) })),
}));

vi.mock("../../store", () => ({
  useAppStore: (selector: (s: any) => any) =>
    selector({ premiumEntitlement: { premium: mockPremium.value, plan: null, expiresAt: null } }),
}));

beforeEach(() => {
  mockPremium.value = false;
  relayPublished.mockClear();
  usePersonalSiteChatStore.setState({
    hydrated: true,
    ns: "ns1",
    siteChats: [],
    channelKeys: {},
    websiteContacts: [],
    messages: {},
    lastGuestKeys: {},
  });
});

describe("PersonalSiteChatManager", () => {
  it("creates a site chat and shows its embed snippet", async () => {
    render(<PersonalSiteChatManager />);
    fireEvent.change(screen.getByLabelText(/Site chat name/), { target: { value: "Sales" } });
    fireEvent.click(screen.getByRole("button", { name: /Create/ }));
    await waitFor(() => expect(usePersonalSiteChatStore.getState().siteChats).toHaveLength(1));
    const created = usePersonalSiteChatStore.getState().siteChats[0];
    expect(created.name).toBe("Sales");
    expect(created.snippet).toContain("<script");
    await waitFor(() => expect(screen.getAllByLabelText(/Embed snippet/).length).toBeGreaterThan(0));
  });

  it("does not create when the name is empty", () => {
    render(<PersonalSiteChatManager />);
    fireEvent.click(screen.getByRole("button", { name: /Create/ }));
    expect(usePersonalSiteChatStore.getState().siteChats).toHaveLength(0);
  });

  it("shows a premium upsell (not a toggle) for non-premium users", () => {
    usePersonalSiteChatStore.setState({
      siteChats: [
        {
          id: "psc_1",
          name: "Sales",
          token: "x",
          snippet: '<script src="e.js" data-messanger-token="x" async></script>',
          config: { accent: "#2563EB", position: "bottom-right", greeting: "Hi", collectContact: false, hideBrand: false },
          createdAt: Date.now(),
        },
      ],
      channelKeys: { psc_1: { publicKeyB64: "P", secretKeyB64: "S" } },
    });
    render(<PersonalSiteChatManager />);
    expect(screen.getByText(/Remove Mess&Anger branding/)).toBeTruthy();
    expect(screen.queryAllByRole("switch").length).toBe(0);
    // Without an onOpenPremium callback there is no CTA button.
    expect(screen.queryByRole("button", { name: /Open Premium/ })).toBeNull();
  });

  it("edits the widget title and sends a canned quick reply", async () => {
    usePersonalSiteChatStore.setState({
      siteChats: [
        {
          id: "psc_1",
          name: "Sales",
          token: "x",
          snippet: '<script src="e.js" data-messanger-token="x" async></script>',
          config: { accent: "#2563EB", position: "bottom-right", greeting: "Hi", collectContact: false, hideBrand: false, title: "Sales" },
          cannedReplies: ["Hi! How can I help?"],
          createdAt: Date.now(),
        },
      ],
      channelKeys: { psc_1: { publicKeyB64: "P", secretKeyB64: "S" } },
      lastGuestKeys: { psc_1: "guest-pub" },
    });
    render(<PersonalSiteChatManager />);

    // Title input is seeded from config.title and can be edited.
    const titleInput = screen.getByLabelText(/Widget name/);
    expect((titleInput as HTMLInputElement).value).toBe("Sales");
    fireEvent.change(titleInput, { target: { value: "Support" } });

    // Open the quick-replies section and click a chip → message appended as operator.
    fireEvent.click(screen.getByText(/Quick replies/));
    fireEvent.click(screen.getByText("Hi! How can I help?"));
    await waitFor(() => {
      const msgs = usePersonalSiteChatStore.getState().messages["psc_1"] ?? [];
      expect(msgs).toHaveLength(1);
      expect(msgs[0].from).toBe("me");
      expect(msgs[0].text).toBe("Hi! How can I help?");
      expect(relayPublished).toHaveBeenCalledTimes(1);
    });
  });

  it("sends a free-text reply from the conversation composer", async () => {
    usePersonalSiteChatStore.setState({
      siteChats: [
        {
          id: "psc_1",
          name: "Sales",
          token: "x",
          snippet: '<script src="e.js" data-messanger-token="x" async></script>',
          config: { accent: "#2563EB", position: "bottom-right", greeting: "Hi", collectContact: false, hideBrand: false },
          createdAt: Date.now(),
        },
      ],
      channelKeys: { psc_1: { publicKeyB64: "P", secretKeyB64: "S" } },
      lastGuestKeys: { psc_1: "guest-pub" },
    });
    render(<PersonalSiteChatManager />);

    fireEvent.click(screen.getByText(/Conversation/));
    const composer = screen.getByPlaceholderText(/Type a reply/);
    fireEvent.change(composer, { target: { value: "We're here!" } });
    fireEvent.click(screen.getByRole("button", { name: /Send reply/ }));

    await waitFor(() => {
      const msgs = usePersonalSiteChatStore.getState().messages["psc_1"] ?? [];
      expect(msgs).toHaveLength(1);
      expect(msgs[0].from).toBe("me");
      expect(msgs[0].text).toBe("We're here!");
      expect(relayPublished).toHaveBeenCalledTimes(1);
    });
  });

  it("lets premium users toggle unbranded widget (hideBrand)", async () => {
    mockPremium.value = true;
    usePersonalSiteChatStore.setState({
      siteChats: [
        {
          id: "psc_1",
          name: "Sales",
          token: "x",
          snippet: '<script src="e.js" data-messanger-token="x" async></script>',
          config: { accent: "#2563EB", position: "bottom-right", greeting: "Hi", collectContact: false, hideBrand: false },
          createdAt: Date.now(),
        },
      ],
      channelKeys: { psc_1: { publicKeyB64: "P", secretKeyB64: "S" } },
    });
    render(<PersonalSiteChatManager />);
    const sw = screen.getAllByRole("switch")[0];
    fireEvent.click(sw);
    await waitFor(() =>
      expect(usePersonalSiteChatStore.getState().siteChats[0].config.hideBrand).toBe(true),
    );
  });
});

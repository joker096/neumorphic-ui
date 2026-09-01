import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppMainContent } from "./AppMainContent";
import type { AppMainContentProps } from "./AppMainContent";

const captured = vi.hoisted(() => ({
  feature: null as any,
  chatList: null as any,
  workspace: null as any,
  contentView: null as any,
}));

vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

vi.mock("../../lib/i18n", async () => {
  const actual = await vi.importActual<typeof import("../../lib/i18n")>(
    "../../lib/i18n",
  );
  return {
    ...actual,
    useI18n: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
  };
});

vi.mock("../../hooks", () => ({
  useKeyboardScroll: () => {},
}));

vi.mock("../../lib/lazyViews", () => ({
  FeatureViews: (props: any) => {
    captured.feature = props;
    return React.createElement("div", {
      "data-testid": "feature-views",
      "data-view": props.view,
    });
  },
}));

vi.mock("../ChatListView", () => ({
  ChatListView: (props: any) => {
    captured.chatList = props;
    return React.createElement("div", { "data-testid": "chat-list-view" });
  },
}));

vi.mock("../chat/ActiveChatWorkspace", () => ({
  ActiveChatWorkspace: (props: any) => {
    captured.workspace = props;
    return React.createElement("div", { "data-testid": "active-chat-workspace" });
  },
}));

vi.mock("./ContentView", () => ({
  ContentView: (props: any) => {
    captured.contentView = props;
    return React.createElement("div", { "data-testid": "content-view" }, props.children);
  },
}));

const baseProps: AppMainContentProps = {
  isMobile: false,
  isChatListRoute: true,
  theme: "dark",
  isDark: true,
  view: "settings",
  subView: null,
  setSubView: vi.fn(),
  contacts: [],
  setContacts: vi.fn(),
  showContactPicker: false,
  setShowContactPicker: vi.fn(),
  setEditingContact: vi.fn(),
  chats: [],
  setChats: vi.fn(),
  setActiveChat: vi.fn(),
  setView: vi.fn(),
  handlePreviewCall: vi.fn(),
  handlePreviewMessage: vi.fn(),
  fontSize: "16px",
  setFontSize: vi.fn(),
  activeStory: null,
  setActiveStory: vi.fn(),
  showStoryComposer: false,
  onCloseComposer: vi.fn(),
  stealthMode: false,
  activeChat: null,
  activeChatWorkspaceProps: { marker: "ws" },
  onCloseChat: vi.fn(),
  chatListProps: { marker: "list" },
  activeBotId: null,
  setActiveBotId: vi.fn(),
  miniAppBotId: null,
  setMiniAppBotId: vi.fn(),
};

describe("AppMainContent", () => {
  beforeEach(() => {
    captured.feature = null;
    captured.chatList = null;
    captured.workspace = null;
    captured.contentView = null;
  });

  it.each([
    ["settings"],
    ["profile"],
    ["recordings"],
    ["radar"],
    ["workplace"],
    ["bot"],
    ["miniApp"],
  ])("renders FeatureViews for desktop feature view %s", (view) => {
    render(<AppMainContent {...baseProps} view={view} />);
    expect(screen.getByTestId("feature-views")).toHaveAttribute("data-view", view);
    expect(captured.feature).toMatchObject({
      view,
      subView: null,
      contacts: [],
      fontSize: "16px",
    });
    expect(captured.feature.onCall).toBe(baseProps.handlePreviewCall);
  });

  it("renders ActiveChatWorkspace when chat open on non-feature view", () => {
    render(
      <AppMainContent
        {...baseProps}
        view="chats"
        activeChat={{ id: "c-1" }}
        activeChatWorkspaceProps={{ marker: "ws" }}
        onCloseChat={vi.fn()}
      />,
    );
    expect(screen.queryByTestId("feature-views")).not.toBeInTheDocument();
    expect(screen.queryByTestId("chat-list-view")).not.toBeInTheDocument();
    expect(captured.workspace).toMatchObject({ marker: "ws" });
    expect(captured.workspace.onCloseChat).toBeTypeOf("function");
  });

  it("renders nothing on desktop non-feature view without active chat", () => {
    render(<AppMainContent {...baseProps} view="chats" />);
    expect(screen.queryByTestId("feature-views")).not.toBeInTheDocument();
    expect(screen.queryByTestId("chat-list-view")).not.toBeInTheDocument();
    expect(screen.queryByTestId("active-chat-workspace")).not.toBeInTheDocument();
    expect(screen.getByTestId("content-view")).toBeEmptyDOMElement();
  });

  it("renders FeatureViews on mobile outside chat list route", () => {
    render(<AppMainContent {...baseProps} isMobile isChatListRoute={false} view="profile" />);
    expect(screen.getByTestId("feature-views")).toHaveAttribute("data-view", "profile");
  });

  it("renders ChatListView on mobile chat list route without active chat", () => {
    render(
      <AppMainContent {...baseProps} isMobile isChatListRoute view="chats" chatListProps={{ marker: "list" }} />,
    );
    expect(screen.getByTestId("chat-list-view")).toBeInTheDocument();
    expect(captured.chatList).toMatchObject({ marker: "list" });
  });

  it("prefers ActiveChatWorkspace over chat list on mobile", () => {
    render(
      <AppMainContent
        {...baseProps}
        isMobile
        isChatListRoute
        view="chats"
        activeChat={{ id: "c-1" }}
        activeChatWorkspaceProps={{ marker: "ws" }}
      />,
    );
    expect(screen.queryByTestId("chat-list-view")).not.toBeInTheDocument();
    expect(screen.getByTestId("active-chat-workspace")).toBeInTheDocument();
  });

  it("labels main region and applies desktop padding class", () => {
    render(<AppMainContent {...baseProps} view="chats" />);
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main-content");
    expect(main).toHaveAccessibleName("a11y.mainContent");
    expect(main).not.toHaveClass(/pb-\[calc/);
  });

  it("applies mobile bottom padding class on mobile", () => {
    render(<AppMainContent {...baseProps} isMobile view="chats" />);
    expect(screen.getByRole("main")).toHaveClass(/pb-\[calc/);
  });

  it("passes story close handler to ContentView", () => {
    const setActiveStory = vi.fn();
    render(
      <AppMainContent {...baseProps} view="chats" setActiveStory={setActiveStory} />,
    );
    expect(captured.contentView).toMatchObject({
      isDark: true,
      activeStory: null,
      isStealthMode: false,
    });
    captured.contentView.onCloseStory();
    expect(setActiveStory).toHaveBeenCalledWith(null);
  });
});

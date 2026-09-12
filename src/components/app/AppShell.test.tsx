import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AppShell } from "./AppShell";
import type { AppShellProps } from "./AppShell";

const mobileFlags = vi.hoisted(() => ({ isMobile: false }));
vi.mock("../../hooks/useMediaQuery", () => ({
  useIsMobile: () => mobileFlags.isMobile,
}));

vi.mock("../../hooks/useLocalStorage", async () => {
  const { useState } = await import("react");
  return {
    useLocalStorage: (_key: string, initial: number) => useState<number>(initial),
  };
});

const captured = vi.hoisted(() => ({
  sidebar: null as any,
  sideList: null as any,
  main: null as any,
  bottomNav: null as any,
}));

vi.mock("./AppSideList", () => ({
  AppSideList: (props: any) => {
    captured.sideList = props;
    return React.createElement("div", { "data-testid": "app-side-list" });
  },
}));

vi.mock("./AppMainContent", () => ({
  AppMainContent: (props: any) => {
    captured.main = props;
    return React.createElement("main", { "data-testid": "app-main-content" });
  },
}));

vi.mock("../ecochat/EcoSidebarNav", () => ({
  EcoSidebarNav: (props: any) => {
    captured.sidebar = props;
    return React.createElement("aside", { "data-testid": "eco-sidebar" });
  },
}));

vi.mock("../navigation", () => ({
  BottomNav: (props: any) => {
    captured.bottomNav = props;
    return React.createElement("footer", { "data-testid": "bottom-nav" });
  },
}));

vi.mock("../status/OfflineBanner", () => ({
  OfflineBanner: () => React.createElement("div", { "data-testid": "offline-banner" }),
}));

const baseProps: AppShellProps = {
  theme: "dark",
  isDark: true,
  fontSize: "16px",
  view: "chats",
  subView: null,
  setSubView: vi.fn(),
  activeStory: null,
  setActiveStory: vi.fn(),
  onComposeStory: vi.fn(),
  showStoryComposer: false,
  onCloseComposer: vi.fn(),
  stealthMode: false,
  hideWhenOfficeOnly: false,
  chatsUnread: 3,
  companyUnread: 5,
  handleNavigate: vi.fn(),
  isChatListRoute: true,
  activeChat: { id: "c-1" },
  setActiveChat: vi.fn(),
  activeChatWorkspaceProps: { marker: "workspace" },
  activeFolder: "all",
  setActiveFolder: vi.fn(),
  chatSearchQuery: "",
  setChatSearchQuery: vi.fn(),
  filteredChats: [],
  filteredChannels: [],
  bots: [],
  archivedUnreadCount: 0,
  toggleArchive: vi.fn(),
  contacts: [],
  setContacts: vi.fn(),
  showContactPicker: false,
  setShowContactPicker: vi.fn(),
  setEditingContact: vi.fn(),
  chats: [],
  setChats: vi.fn(),
  setView: vi.fn(),
  setGlobalSelectedContact: vi.fn(),
  setShowCreateChannel: vi.fn(),
  setShowCreateBot: vi.fn(),
  setShowCreateGroup: vi.fn(),
  setShowAdvancedFilterModal: vi.fn(),
  advancedFilters: {},
  handlePreviewCall: vi.fn(),
  handlePreviewMessage: vi.fn(),
  onOpenChat: vi.fn(),
  onCloseChat: vi.fn(),
  setFontSize: vi.fn(),
  t: (key: string, fallback?: string) => fallback ?? key,
  showAddContactFromChat: false,
  setShowAddContactFromChat: vi.fn(),
  onAddContactFromChat: vi.fn(),
  activeBotId: null,
  setActiveBotId: vi.fn(),
  miniAppBotId: null,
  setMiniAppBotId: vi.fn(),
};

const gridEl = (container: HTMLElement) =>
  Array.from(container.querySelectorAll("div")).find(
    (el) => el.style.gridTemplateColumns,
  ) as HTMLElement;

describe("AppShell", () => {
  beforeEach(() => {
    mobileFlags.isMobile = false;
    captured.sidebar = null;
    captured.sideList = null;
    captured.main = null;
    captured.bottomNav = null;
  });

  it("renders desktop 3-column grid with default side width", () => {
    const { container } = render(<AppShell {...baseProps} />);
    const grid = gridEl(container);
    expect(grid.style.gridTemplateColumns).toBe("76px 320px 4px 1fr");
  });

  it("sets theme and font-size data attributes on the root", () => {
    const { container } = render(<AppShell {...baseProps} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute("data-theme", "dark");
    expect(root).toHaveAttribute("data-font-size", "16px");
  });

  it("renders live-region for screen readers", () => {
    render(<AppShell {...baseProps} />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });

  it("passes nav state to EcoSidebarNav", () => {
    const onNavigate = vi.fn();
    render(
      <AppShell
        {...baseProps}
        view="company"
        chatsUnread={3}
        companyUnread={5}
        handleNavigate={onNavigate}
      />,
    );
    expect(captured.sidebar).toMatchObject({
      activeView: "company",
      unreadCount: 3,
      companyUnreadCount: 5,
      hideCompany: false,
    });
    expect(captured.sidebar.onNavigate).toBe(onNavigate);
  });

  it("hides company in sidebar when hideWhenOfficeOnly", () => {
    render(<AppShell {...baseProps} hideWhenOfficeOnly />);
    expect(captured.sidebar.hideCompany).toBe(true);
  });

  it("passes chat list props to AppSideList", () => {
    render(<AppShell {...baseProps} activeChat={{ id: "c-1" }} />);
    expect(captured.sideList).toMatchObject({
      view: "chats",
      isChatListRoute: true,
    });
    expect(captured.sideList.chatListProps.activeChatId).toBe("c-1");
    expect(captured.sideList.chatListProps.onOpenChat).toBe(baseProps.onOpenChat);
  });

  it("wires onOpenPremium to settings premium subview (D5 regression)", () => {
    const setSubView = vi.fn();
    const setView = vi.fn();
    render(<AppShell {...baseProps} setSubView={setSubView} setView={setView} />);
    captured.sideList.onOpenPremium();
    expect(setSubView).toHaveBeenCalledWith("premium");
    expect(setView).toHaveBeenCalledWith("settings");
  });

  it("wires onComposeStory into desktop chat list props", () => {
    const onComposeStory = vi.fn();
    render(<AppShell {...baseProps} onComposeStory={onComposeStory} />);
    expect(captured.sideList.chatListProps.onComposeStory).toBe(onComposeStory);
  });

  it("wires onComposeStory into mobile chat list props (D5 regression)", () => {
    mobileFlags.isMobile = true;
    const onComposeStory = vi.fn();
    render(<AppShell {...baseProps} onComposeStory={onComposeStory} />);
    expect(captured.main.chatListProps.onComposeStory).toBe(onComposeStory);
  });

  it("passes desktop main content props to AppMainContent", () => {
    render(<AppShell {...baseProps} />);
    expect(captured.main).toMatchObject({
      isMobile: false,
      view: "chats",
      subView: null,
    });
    expect(captured.main.chatListProps).toBeDefined();
    expect(captured.main.activeChatWorkspaceProps).toBe(baseProps.activeChatWorkspaceProps);
  });

  it("renders mobile layout without rail and side list", () => {
    mobileFlags.isMobile = true;
    const { container } = render(<AppShell {...baseProps} />);
    expect(captured.main.isMobile).toBe(true);
    expect(captured.sidebar).toBeNull();
    expect(captured.sideList).toBeNull();
    expect(gridEl(container)).toBeUndefined();
  });

  it("resets side width to 320px on separator double-click", () => {
    const { container } = render(<AppShell {...baseProps} />);
    const sep = screen.getByRole("separator");
    fireEvent.mouseDown(sep, { clientX: 500 });
    fireEvent.mouseMove(window, { clientX: 300 });
    fireEvent.mouseUp(window);
    expect(gridEl(container).style.gridTemplateColumns).toContain("240px");
    fireEvent.doubleClick(sep);
    expect(gridEl(container).style.gridTemplateColumns).toContain("320px");
  });

  it("clamps dragged side width to 240px minimum", () => {
    const { container } = render(<AppShell {...baseProps} />);
    const sep = screen.getByRole("separator");
    fireEvent.mouseDown(sep, { clientX: 500 });
    fireEvent.mouseMove(window, { clientX: 0 });
    fireEvent.mouseUp(window);
    expect(gridEl(container).style.gridTemplateColumns).toContain("240px");
  });

  it("clamps dragged side width to 480px maximum", () => {
    const { container } = render(<AppShell {...baseProps} />);
    const sep = screen.getByRole("separator");
    fireEvent.mouseDown(sep, { clientX: 100 });
    fireEvent.mouseMove(window, { clientX: 5000 });
    fireEvent.mouseUp(window);
    expect(gridEl(container).style.gridTemplateColumns).toContain("480px");
  });

  it("stops resizing after mouseup", () => {
    const { container } = render(<AppShell {...baseProps} />);
    const sep = screen.getByRole("separator");
    fireEvent.mouseDown(sep, { clientX: 500 });
    fireEvent.mouseMove(window, { clientX: 400 });
    fireEvent.mouseUp(window);
    fireEvent.mouseMove(window, { clientX: 300 });
    expect(gridEl(container).style.gridTemplateColumns).toContain("240px");
  });

  it("renders offline banner and mobile bottom nav", () => {
    render(<AppShell {...baseProps} />);
    expect(screen.getByTestId("offline-banner")).toBeInTheDocument();
    expect(captured.bottomNav).toMatchObject({
      unreadCount: 3,
      companyUnreadCount: 5,
    });
    expect(captured.bottomNav.onNavigate).toBe(baseProps.handleNavigate);
  });
});

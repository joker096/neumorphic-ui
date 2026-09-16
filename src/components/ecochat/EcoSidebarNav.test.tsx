import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { EcoSidebarNav } from "./EcoSidebarNav";

const state = vi.hoisted(() => ({
  userProfile: {
    id: "u-1",
    name: "Alice",
    username: "alice",
    avatar: undefined as string | undefined,
  },
  companyMembers: [{ userId: "u-1", role: "admin" }],
}));

vi.mock("../../store", () => ({
  useAppStore: (selector?: (s: typeof state) => unknown) =>
    selector ? selector(state) : state,
}));

const LABELS: Record<string, string> = {
  "nav.chats": "Chats",
  "nav.contacts": "Contacts",
  "nav.calls": "Calls",
  "settings.company": "Company",
  "nav.workplace": "Workplace",
  "settings.defaultUserName": "User",
};

const t = (key: string, fallback?: string) => LABELS[key] ?? fallback ?? key;

const resetState = () => {
  state.userProfile = { id: "u-1", name: "Alice", username: "alice", avatar: undefined };
  state.companyMembers = [{ userId: "u-1", role: "admin" }];
};

describe("EcoSidebarNav", () => {
  beforeEach(() => {
    resetState();
  });

  it("renders all nav items for company admin", () => {
    render(<EcoSidebarNav activeView="chats" t={t} />);
    expect(screen.getByRole("button", { name: "Chats" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Contacts" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Calls" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Company" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Workplace" })).toBeInTheDocument();
  });

  it("renders nav items as icon-only labeled buttons", () => {
    render(<EcoSidebarNav activeView="chats" t={t} />);
    const chatsBtn = screen.getByRole("button", { name: "Chats" });
    expect(chatsBtn).toHaveAttribute("aria-label", "Chats");
    expect(chatsBtn).not.toHaveTextContent("Chats");
  });

  it("hides adminOnly workplace item for non-admin", () => {
    state.companyMembers = [];
    render(<EcoSidebarNav activeView="chats" t={t} />);
    expect(
      screen.queryByRole("button", { name: "Workplace" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Chats" })).toBeInTheDocument();
  });

  it("hides company item when hideCompany is set", () => {
    render(<EcoSidebarNav activeView="chats" hideCompany t={t} />);
    expect(screen.queryByRole("button", { name: "Company" })).not.toBeInTheDocument();
  });

  it.each([
    ["Chats", "chats"],
    ["Contacts", "contacts"],
    ["Calls", "calls"],
    ["Company", "company"],
    ["Workplace", "workplace"],
  ] as const)("navigates to %s via %s item", (name, view) => {
    const onNavigate = vi.fn();
    render(<EcoSidebarNav activeView="chats" onNavigate={onNavigate} t={t} />);
    fireEvent.click(screen.getByRole("button", { name: name }));
    expect(onNavigate).toHaveBeenCalledWith(view);
  });

  it("marks the active item with aria-current", () => {
    render(<EcoSidebarNav activeView="calls" t={t} />);
    expect(screen.getByRole("button", { name: "Calls" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("button", { name: "Chats" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("shows unread badge on chats item", () => {
    render(<EcoSidebarNav activeView="chats" unreadCount={5} t={t} />);
    const btn = screen.getByRole("button", { name: "Chats" });
    expect(within(btn).getByText("5")).toBeInTheDocument();
  });

  it("caps badge at 99+", () => {
    render(<EcoSidebarNav activeView="chats" unreadCount={150} t={t} />);
    const btn = screen.getByRole("button", { name: "Chats" });
    expect(within(btn).getByText("99+")).toBeInTheDocument();
  });

  it("hides badge when count is zero", () => {
    render(<EcoSidebarNav activeView="chats" unreadCount={0} t={t} />);
    const btn = screen.getByRole("button", { name: "Chats" });
    expect(btn).not.toHaveTextContent("0");
  });

  it("shows companyUnreadCount badge on company item", () => {
    render(
      <EcoSidebarNav
        activeView="chats"
        unreadCount={0}
        companyUnreadCount={7}
        t={t}
      />,
    );
    const companyBtn = screen.getByRole("button", { name: "Company" });
    expect(within(companyBtn).getByText("7")).toBeInTheDocument();
    const chatsBtn = screen.getByRole("button", { name: "Chats" });
    expect(within(chatsBtn).queryByText("7")).not.toBeInTheDocument();
  });

  it("labels profile button with user name", () => {
    render(<EcoSidebarNav activeView="chats" t={t} />);
    expect(screen.getByRole("button", { name: "Alice" })).toBeInTheDocument();
  });

  it("falls back to @username when name missing", () => {
    state.userProfile = { id: "u-1", name: "", username: "alice", avatar: undefined };
    render(<EcoSidebarNav activeView="chats" t={t} />);
    expect(screen.getByRole("button", { name: "@alice" })).toBeInTheDocument();
  });

  it("falls back to translated default when name and username missing", () => {
    state.userProfile = { id: "u-1", name: "", username: "", avatar: undefined };
    render(<EcoSidebarNav activeView="chats" t={t} />);
    expect(screen.getByRole("button", { name: "User" })).toBeInTheDocument();
  });

  it("shows avatar image when set", () => {
    state.userProfile = {
      id: "u-1",
      name: "Alice",
      username: "alice",
      avatar: "https://cdn.example/a.png",
    };
    render(<EcoSidebarNav activeView="chats" t={t} />);
    const img = screen.getByAltText("Alice profile picture");
    expect(img).toHaveAttribute("src", "https://cdn.example/a.png");
  });

  it("renders initial letter when no avatar", () => {
    render(<EcoSidebarNav activeView="chats" t={t} />);
    const profile = screen.getByRole("button", { name: "Alice" });
    expect(profile).toHaveTextContent("A");
  });

  it("navigates to settings on profile click", () => {
    const onNavigate = vi.fn();
    render(<EcoSidebarNav activeView="chats" onNavigate={onNavigate} t={t} />);
    fireEvent.click(screen.getByRole("button", { name: "Alice" }));
    expect(onNavigate).toHaveBeenCalledWith("settings");
  });

  it("does not crash when onNavigate is omitted", () => {
    render(<EcoSidebarNav activeView="chats" t={t} />);
    fireEvent.click(screen.getByRole("button", { name: "Chats" }));
    fireEvent.click(screen.getByRole("button", { name: "Alice" }));
  });

  it("uses glass ds-sidebar surface (theme-agnostic tokens)", () => {
    const { container } = render(<EcoSidebarNav activeView="chats" t={t} />);
    const aside = container.firstElementChild as HTMLElement;
    expect(aside.className).toContain("ds-sidebar");
    expect(aside.style.background).toBe("");
  });
});

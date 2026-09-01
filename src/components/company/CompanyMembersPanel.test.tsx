import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { CompanyMembersPanel } from "./CompanyMembersPanel";
import { CHANNEL_CLICK_GRADIENT } from "../../constants/companyConstants";
import type { TFunction } from "./useCompanyContacts";
import type { CompanyMember, CompanyChannel } from "../../lib/company/types";

const memberListProps = vi.hoisted(() => ({ current: null as any }));
const channelListProps = vi.hoisted(() => ({ current: null as any }));

vi.mock("./MemberList", () => ({
  MemberList: (props: any) => {
    memberListProps.current = props;
    return null;
  },
}));

vi.mock("./ChannelList", () => ({
  ChannelList: (props: any) => {
    channelListProps.current = props;
    return null;
  },
}));

const t: TFunction = (key, fallback) => (fallback ?? key) as string;

const members: CompanyMember[] = [
  { userId: "u1", displayName: "Alice", role: "admin", publicKey: "pk1", joinedAt: 0, lastActive: 0, online: true },
  { userId: "u2", displayName: "Bob", role: "member", publicKey: "pk2", joinedAt: 0, lastActive: 0, online: false },
];

const channels: CompanyChannel[] = [
  { id: "c1", companyId: "org_1", name: "General", unread: 0, memberCount: 2, createdAt: 0 },
];

function makeProps(overrides: Record<string, unknown> = {}) {
  return {
    isDark: false,
    members,
    channels,
    canManage: true,
    currentUserId: "u1",
    groupMode: false,
    selectedIds: new Set<string>(["u2"]),
    t,
    onCall: vi.fn(),
    onVideoCall: vi.fn(),
    onMessage: vi.fn(),
    onToggleSelect: vi.fn(),
    onMemberEdit: vi.fn(),
    onEnterGroupMode: vi.fn(),
    onExitGroupMode: vi.fn(),
    onStartGroupCall: vi.fn(),
    ...overrides,
  };
}

describe("CompanyMembersPanel", () => {
  it("shows the group-mode enter button when not in group mode", () => {
    render(<CompanyMembersPanel {...makeProps()} />);
    const btn = screen.getByRole("button", { name: "Group video call" });
    expect(btn).toBeEnabled();
    expect(memberListProps.current.selectable).toBe(false);
  });

  it("disables group mode with fewer than 2 members", () => {
    render(<CompanyMembersPanel {...makeProps({ members: members.slice(0, 1) })} />);
    expect(screen.getByRole("button", { name: "Group video call" })).toBeDisabled();
  });

  it("enters group mode from the enter button", () => {
    const onEnterGroupMode = vi.fn();
    render(<CompanyMembersPanel {...makeProps({ onEnterGroupMode })} />);
    fireEvent.click(screen.getByRole("button", { name: "Group video call" }));
    expect(onEnterGroupMode).toHaveBeenCalledTimes(1);
  });

  it("shows cancel and footer in group mode, wires start group call", () => {
    const onExitGroupMode = vi.fn();
    const onStartGroupCall = vi.fn();
    render(<CompanyMembersPanel {...makeProps({ groupMode: true, onExitGroupMode, onStartGroupCall })} />);
    expect(screen.queryByRole("button", { name: "Group video call" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onExitGroupMode).toHaveBeenCalledTimes(1);

    expect(screen.getByText("Selected: 1")).toBeInTheDocument();
    const startCall = screen.getByRole("button", { name: "Start call" });
    expect(startCall).toBeEnabled();
    fireEvent.click(startCall);
    expect(onStartGroupCall).toHaveBeenCalledTimes(1);
  });

  it("disables start call when nothing is selected", () => {
    render(<CompanyMembersPanel {...makeProps({ groupMode: true, selectedIds: new Set<string>() })} />);
    expect(screen.getByRole("button", { name: "Start call" })).toBeDisabled();
  });

  it("disables start call when only the current user is selected", () => {
    render(<CompanyMembersPanel {...makeProps({ groupMode: true, selectedIds: new Set<string>(["u1"]) })} />);
    expect(screen.getByRole("button", { name: "Start call" })).toBeDisabled();
  });

  it("passes selection props to MemberList and forwards member clicks to onMessage", () => {
    const onMessage = vi.fn();
    render(<CompanyMembersPanel {...makeProps({ groupMode: true, onMessage })} />);
    expect(memberListProps.current.selectable).toBe(true);
    expect(memberListProps.current.selectedIds).toBeInstanceOf(Set);

    memberListProps.current.onMemberClick(members[0] as CompanyMember, undefined);
    expect(onMessage).toHaveBeenCalledWith("Alice", undefined);
  });

  it("routes channel clicks to onMessage with the channel gradient", () => {
    const onMessage = vi.fn();
    render(<CompanyMembersPanel {...makeProps({ onMessage })} />);
    channelListProps.current.onChannelClick(channels[0] as CompanyChannel);
    expect(onMessage).toHaveBeenCalledWith("General", CHANNEL_CLICK_GRADIENT);
  });
});

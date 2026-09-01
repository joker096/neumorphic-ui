import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemberDetailModal } from "./MemberDetailModal";
import type { CompanyMember } from "../../lib/company/types";

const toastSuccess = vi.hoisted(() => vi.fn());
const toastError = vi.hoisted(() => vi.fn());

vi.mock("sonner", () => ({
  toast: { success: toastSuccess, error: toastError },
}));

vi.mock("../../lib/i18n", () => ({
  useI18n: () => ({ t: (key: string, fallback?: string) => (fallback ?? key) as string }),
}));

const member: CompanyMember = {
  userId: "u2",
  displayName: "Bob Lee",
  role: "manager",
  publicKey: "pk",
  joinedAt: 0,
  lastActive: 0,
  online: false,
};

const defaultProps = {
  member,
  canManage: true,
  isCurrentUser: false,
  onClose: () => {},
  onSave: () => {},
  onChangeRole: () => {},
  onRemove: () => {},
};

describe("MemberDetailModal", () => {
  beforeEach(() => {
    toastSuccess.mockClear();
    toastError.mockClear();
  });

  it("renders the member name and role label", () => {
    render(<MemberDetailModal {...defaultProps} />);
    expect(screen.getByText("Bob Lee")).toBeInTheDocument();
    expect(screen.getByText("Manager")).toBeInTheDocument();
  });

  it("marks the current user in the role line", () => {
    render(<MemberDetailModal {...defaultProps} member={{ ...member, displayName: "Alice" }} isCurrentUser />);
    expect(screen.getByText(/• You/)).toBeInTheDocument();
  });

  it("closes via the close button", () => {
    const onClose = vi.fn();
    const { container } = render(<MemberDetailModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(container.querySelector("button") as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders the name input and role buttons with the active role disabled", () => {
    render(<MemberDetailModal {...defaultProps} />);
    expect(screen.getByPlaceholderText("Full name")).toHaveValue("Bob Lee");
    expect(screen.getByRole("button", { name: "Make admin" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Make manager" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Make member" })).toBeEnabled();
  });

  it("changes the role through the role buttons", () => {
    const onChangeRole = vi.fn();
    render(<MemberDetailModal {...defaultProps} onChangeRole={onChangeRole} />);
    fireEvent.click(screen.getByRole("button", { name: "Make admin" }));
    expect(onChangeRole).toHaveBeenCalledWith("admin");
  });

  it("saves a changed name and closes", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<MemberDetailModal {...defaultProps} onSave={onSave} onClose={onClose} />);
    fireEvent.change(screen.getByPlaceholderText("Full name"), { target: { value: "  Bob L. " } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledWith("Bob L.");
    expect(toastSuccess).toHaveBeenCalledWith("Member saved");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes without saving when the name is unchanged", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<MemberDetailModal {...defaultProps} onSave={onSave} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes without saving when the name is blank", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<MemberDetailModal {...defaultProps} onSave={onSave} onClose={onClose} />);
    fireEvent.change(screen.getByPlaceholderText("Full name"), { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("removes the member through the confirm dialog", () => {
    const onRemove = vi.fn();
    const onClose = vi.fn();
    render(<MemberDetailModal {...defaultProps} onRemove={onRemove} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove from company" }));
    expect(screen.getByText("Remove this member?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(toastSuccess).toHaveBeenCalledWith("Member removed");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("cancels the remove confirmation without removing", () => {
    const onRemove = vi.fn();
    render(<MemberDetailModal {...defaultProps} onRemove={onRemove} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove from company" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onRemove).not.toHaveBeenCalled();
  });

  it("disables remove and downgrade for the current user", () => {
    render(<MemberDetailModal {...defaultProps} isCurrentUser />);
    expect(screen.getByRole("button", { name: "Remove from company" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Make member" })).toBeDisabled();
  });

  it("shows the restricted copy and no controls when canManage is false", () => {
    render(<MemberDetailModal {...defaultProps} canManage={false} />);
    expect(screen.getByText("Only company admins can edit")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Full name")).toBeNull();
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
  });
});

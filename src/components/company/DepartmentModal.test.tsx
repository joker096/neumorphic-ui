import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { DepartmentModal } from "./DepartmentModal";
import type { CompanyDepartment, CompanyMember } from "../../types/constants";
import { DEPARTMENT_COLORS } from "../../constants/companyConstants";

const toastSuccess = vi.hoisted(() => vi.fn());
const toastError = vi.hoisted(() => vi.fn());

vi.mock("sonner", () => ({
  toast: { success: toastSuccess, error: toastError },
}));

vi.mock("../../lib/i18n", () => ({
  useI18n: () => ({ t: (key: string, fallback?: string) => (fallback ?? key) as string }),
}));

const alice: CompanyMember = {
  userId: "u1",
  displayName: "Alice Smith",
  role: "admin",
  publicKey: "pk",
  joinedAt: 0,
  lastActive: 0,
  online: false,
};

const bob: CompanyMember = {
  userId: "u2",
  displayName: "Bob Lee",
  role: "member",
  publicKey: "pk",
  joinedAt: 0,
  lastActive: 0,
  online: false,
};

const department: CompanyDepartment = {
  id: "d1",
  name: "Engineering",
  description: "Builds things",
  color: "from-teal-400 to-cyan-500",
  memberIds: ["u1"],
  createdAt: 0,
};

describe("DepartmentModal", () => {
  beforeEach(() => {
    toastSuccess.mockClear();
    toastError.mockClear();
  });

  it("shows the Add heading for a new department", () => {
    render(<DepartmentModal department={null} members={[]} canManage onClose={() => {}} onSave={() => {}} />);
    expect(screen.getByText("Add department")).toBeInTheDocument();
  });

  it("shows the Edit heading with prefilled values for an existing department", () => {
    render(<DepartmentModal department={department} members={[alice]} canManage onClose={() => {}} onSave={() => {}} />);
    expect(screen.getByText("Edit department")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. Engineering")).toHaveValue("Engineering");
    expect(screen.getByPlaceholderText("What does this department do?")).toHaveValue("Builds things");
  });

  it("closes via the close button", () => {
    const onClose = vi.fn();
    const { container } = render(
      <DepartmentModal department={null} members={[]} canManage onClose={onClose} onSave={() => {}} />,
    );
    fireEvent.click(container.querySelector("button") as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not save when the name is empty", () => {
    const onSave = vi.fn();
    render(<DepartmentModal department={null} members={[]} canManage onClose={() => {}} onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(toastError).toHaveBeenCalledWith("Department name");
    expect(onSave).not.toHaveBeenCalled();
  });

  it("saves a new department with a toggled member and the default color", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<DepartmentModal department={null} members={[alice, bob]} canManage onClose={onClose} onSave={onSave} />);
    fireEvent.change(screen.getByPlaceholderText("e.g. Engineering"), { target: { value: "New dept" } });
    fireEvent.click(screen.getByRole("button", { name: /Bob Lee/ }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onSave).toHaveBeenCalledTimes(1);
    const input = onSave.mock.calls[0][0];
    expect(input.name).toBe("New dept");
    expect(input.description).toBeUndefined();
    expect(input.color).toBe("from-indigo-400 to-purple-500");
    expect(input.memberIds).toEqual(["u2"]);
    expect(toastSuccess).toHaveBeenCalledWith("Saved");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("saves an edited department preserving its color and description", () => {
    const onSave = vi.fn();
    render(<DepartmentModal department={department} members={[alice, bob]} canManage onClose={() => {}} onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    const input = onSave.mock.calls[0][0];
    expect(input.name).toBe("Engineering");
    expect(input.description).toBe("Builds things");
    expect(input.color).toBe("from-teal-400 to-cyan-500");
    expect(input.memberIds).toEqual(["u1"]);
  });

  it("toggles a preselected member off", () => {
    const onSave = vi.fn();
    render(<DepartmentModal department={department} members={[alice, bob]} canManage onClose={() => {}} onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: /Alice Smith/ }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave.mock.calls[0][0].memberIds).toEqual([]);
  });

  it("applies the selected color swatch", () => {
    const onSave = vi.fn();
    const { container } = render(
      <DepartmentModal department={null} members={[]} canManage onClose={() => {}} onSave={onSave} />,
    );
    const swatches = container.querySelectorAll("button[class*='rounded-full']");
    fireEvent.click(swatches[2] as HTMLElement);
    fireEvent.change(screen.getByPlaceholderText("e.g. Engineering"), { target: { value: "Colored" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave.mock.calls[0][0].color).toBe(DEPARTMENT_COLORS[1]);
  });

  it("removes the department through the confirm dialog", () => {
    const onRemove = vi.fn();
    const onClose = vi.fn();
    render(
      <DepartmentModal department={department} members={[alice]} canManage onClose={onClose} onSave={() => {}} onRemove={onRemove} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(screen.getByText("Remove this department?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onRemove).toHaveBeenCalledWith("d1");
    expect(toastSuccess).toHaveBeenCalledWith("Removed");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("cancels the remove confirmation without removing", () => {
    const onRemove = vi.fn();
    render(
      <DepartmentModal department={department} members={[]} canManage onClose={() => {}} onSave={() => {}} onRemove={onRemove} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onRemove).not.toHaveBeenCalled();
  });

  it("hides the remove button for a new department", () => {
    render(<DepartmentModal department={null} members={[]} canManage onClose={() => {}} onSave={() => {}} />);
    expect(screen.queryByRole("button", { name: "Remove" })).toBeNull();
  });
});

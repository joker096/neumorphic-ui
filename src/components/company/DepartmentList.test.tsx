import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { DepartmentList } from "./DepartmentList";
import type { CompanyDepartment, CompanyMember } from "../../types/constants";

const t = (key: string, fallback?: Record<string, string | number> | string): string =>
  (fallback as string) ?? key;

const members: CompanyMember[] = [
  { userId: "u1", displayName: "Alice Smith", role: "admin", publicKey: "pk1", joinedAt: 0, lastActive: 0, online: true },
  { userId: "u2", displayName: "Bob Doe", role: "manager", publicKey: "pk2", joinedAt: 0, lastActive: 0, online: false },
  { userId: "u3", displayName: "Carol Lee", role: "member", publicKey: "pk3", joinedAt: 0, lastActive: 0, online: false },
  { userId: "u4", displayName: "Dan Fox", role: "member", publicKey: "pk4", joinedAt: 0, lastActive: 0, online: false },
];

const department: CompanyDepartment = {
  id: "d1",
  name: "Engineering",
  description: "Builds the product",
  memberIds: ["u1", "u2", "u3", "u4"],
  createdAt: 0,
};

const base = {
  departments: [department],
  members,
  departmentsLabel: "Departments",
  addLabel: "Add department",
  t,
};

describe("DepartmentList", () => {
  it("renders the header with the department count", () => {
    render(<DepartmentList {...base} canManage={false} />);
    expect(screen.getByText("Departments (1)")).toBeInTheDocument();
  });

  it("shows the add button only when canManage is set and invokes it", () => {
    const onAdd = vi.fn();
    render(<DepartmentList {...base} canManage onAdd={onAdd} />);
    fireEvent.click(screen.getByRole("button", { name: "Add department" }));
    expect(onAdd).toHaveBeenCalledTimes(1);

    const { container } = render(<DepartmentList {...base} canManage={false} onAdd={onAdd} />);
    expect(container.querySelector("[aria-label='Add department']")).toBeNull();
  });

  it("shows the loading state", () => {
    render(<DepartmentList {...base} departments={[]} loading />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows the error state with a retry button that invokes onRetry", () => {
    const onRetry = vi.fn();
    render(<DepartmentList {...base} departments={[]} error="Could not load departments" onRetry={onRetry} />);
    expect(screen.getByText("Could not load departments")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows the empty state when there are no departments", () => {
    render(<DepartmentList {...base} departments={[]} />);
    expect(screen.getByText("No departments yet")).toBeInTheDocument();
  });

  it("renders department details, member avatars and the overflow count, and invokes onDepartmentClick", () => {
    const onDepartmentClick = vi.fn();
    render(<DepartmentList {...base} onDepartmentClick={onDepartmentClick} />);

    expect(screen.getByText("Engineering")).toBeInTheDocument();
    expect(screen.getByText("Builds the product")).toBeInTheDocument();
    expect(screen.getByText("4 member(s)")).toBeInTheDocument();

    expect(screen.getByText("AS")).toBeInTheDocument();
    expect(screen.getByText("BD")).toBeInTheDocument();
    expect(screen.getByText("CL")).toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Engineering/ }));
    expect(onDepartmentClick).toHaveBeenCalledWith(department);
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ContactList } from "./ContactList";
import type { CompanyContact, CompanyDepartment } from "../../types/constants";

const t = (key: string, fallback?: Record<string, string | number> | string): string =>
  (fallback as string) ?? key;

const departments: CompanyDepartment[] = [
  { id: "d1", name: "Engineering", memberIds: [], createdAt: 0 },
];

const contact: CompanyContact = {
  id: "c1",
  name: "Alice Smith",
  title: "CTO",
  phone: "+1 555 0100",
  email: "alice@example.com",
  departmentId: "d1",
  createdAt: 0,
};

const base = {
  contacts: [contact],
  departments,
  contactsLabel: "Contacts",
  addLabel: "Add contact",
  t,
};

describe("ContactList", () => {
  it("renders the header with the contact count", () => {
    render(<ContactList {...base} canManage={false} />);
    expect(screen.getByText("Contacts (1)")).toBeInTheDocument();
  });

  it("shows the add button only when canManage is set and invokes it", () => {
    const onAdd = vi.fn();
    render(<ContactList {...base} canManage onAdd={onAdd} />);
    const button = screen.getByRole("button", { name: "Add contact" });
    fireEvent.click(button);
    expect(onAdd).toHaveBeenCalledTimes(1);

    const { container } = render(<ContactList {...base} canManage={false} onAdd={onAdd} />);
    expect(container.querySelector("[aria-label='Add contact']")).toBeNull();
  });

  it("shows the loading state", () => {
    render(<ContactList {...base} contacts={[]} loading />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows the error state with a retry button that invokes onRetry", () => {
    const onRetry = vi.fn();
    render(<ContactList {...base} contacts={[]} error="Something went wrong" onRetry={onRetry} />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("omits the retry button when onRetry is not provided", () => {
    const { container } = render(<ContactList {...base} contacts={[]} error="Something went wrong" />);
    expect(container.querySelector("[aria-label='Retry']")).toBeNull();
  });

  it("shows the empty state when there are no contacts", () => {
    render(<ContactList {...base} contacts={[]} />);
    expect(screen.getByText("No contacts yet")).toBeInTheDocument();
  });

  it("renders contact details with the department badge and invokes onContactClick", () => {
    const onContactClick = vi.fn();
    render(<ContactList {...base} onContactClick={onContactClick} />);

    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("CTO")).toBeInTheDocument();
    expect(screen.getByText("+1 555 0100")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("Engineering")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Alice Smith/ }));
    expect(onContactClick).toHaveBeenCalledWith(contact);
  });
});

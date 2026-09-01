import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EmptyState, ErrorState } from "./States";

vi.mock("../../lib/i18n", () => ({
  useI18n: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(
      <EmptyState title="No items" description="Add something to get started" />,
    );
    expect(screen.getByText("No items")).toBeInTheDocument();
    expect(screen.getByText("Add something to get started")).toBeInTheDocument();
  });

  it("renders default inbox icon when icon omitted", () => {
    const { container } = render(<EmptyState title="No items" />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("renders custom icon instead of default", () => {
    const { container } = render(
      <EmptyState
        title="No items"
        icon={<i data-testid="custom-icon" />}
      />,
    );
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });

  it("renders action button and invokes onClick", () => {
    const onClick = vi.fn();
    render(
      <EmptyState title="No items" action={{ label: "Create", onClick }} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("omits action button when action missing", () => {
    render(<EmptyState title="No items" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("omits description when missing", () => {
    render(<EmptyState title="No items" />);
    expect(screen.queryByText(/get started/i)).not.toBeInTheDocument();
  });
});

describe("ErrorState", () => {
  it("renders message, description and code", () => {
    render(
      <ErrorState
        message="Something went wrong"
        description="Try again later"
        code="ERR_500"
      />,
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Try again later")).toBeInTheDocument();
    expect(screen.getByText("ERR_500")).toBeInTheDocument();
  });

  it("renders retry button and invokes retryAction", () => {
    const retryAction = vi.fn();
    render(<ErrorState message="Failed" retryAction={retryAction} />);
    fireEvent.click(screen.getByRole("button", { name: "ui.retry" }));
    expect(retryAction).toHaveBeenCalledTimes(1);
  });

  it("renders support button and invokes supportAction", () => {
    const supportAction = vi.fn();
    render(<ErrorState message="Failed" supportAction={supportAction} />);
    fireEvent.click(screen.getByRole("button", { name: "ui.contactSupport" }));
    expect(supportAction).toHaveBeenCalledTimes(1);
  });

  it("omits both buttons when actions missing", () => {
    render(<ErrorState message="Failed" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("omits code block when code missing", () => {
    const { container } = render(<ErrorState message="Failed" />);
    expect(container.querySelector(".font-mono")).toBeNull();
  });
});

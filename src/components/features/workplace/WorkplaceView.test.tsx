import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn(), loading: vi.fn(), dismiss: vi.fn() },
}));

vi.mock("../../../lib/i18n", async () => {
  const actual = await vi.importActual("../../../lib/i18n");
  return {
    ...actual,
    useI18n: () => ({ t: (k: string, fb?: string) => fb ?? k }),
  };
});

import { ServicesProvider } from "../../../services";
import { WorkplaceView } from "./WorkplaceView";

vi.mock("../../../components/ui/Toast", async () => {
  const actual = await vi.importActual("../../../components/ui/Toast");
  return {
    ...actual,
    toast: (msg: string, type?: string) => (type === "error" ? (toast.error as any)(msg) : toast.info(msg)),
  };
});

describe("WorkplaceView resilience", () => {
  it("surfaces an error toast when toggling a task fails (no unhandled rejection)", async () => {
    const tasks = {
      listTasks: vi.fn().mockResolvedValue([{ id: "t1", title: "Fix bug", done: false }]),
      createTask: vi.fn().mockResolvedValue(undefined),
      updateTask: vi.fn().mockRejectedValue(new Error("task not found")),
    };
    render(
      <ServicesProvider services={{ tasks } as any}>
        <WorkplaceView />
      </ServicesProvider>,
    );

    await waitFor(() => expect(screen.getByText("Fix bug")).toBeInTheDocument());

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(tasks.updateTask).toHaveBeenCalledWith("t1", { done: true });
      expect(toast.error).toHaveBeenCalledWith("Could not save changes");
    });
  });

  it("surfaces an error toast when creating a task fails", async () => {
    const tasks = {
      listTasks: vi.fn().mockResolvedValue([]),
      createTask: vi.fn().mockRejectedValue(new Error("creation failed")),
      updateTask: vi.fn().mockResolvedValue(undefined),
    };
    render(
      <ServicesProvider services={{ tasks } as any}>
        <WorkplaceView />
      </ServicesProvider>,
    );

    await waitFor(() => expect(screen.getByPlaceholderText("workplace.newTask")).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText("workplace.newTask"), { target: { value: "New task" } });
    fireEvent.click(screen.getByRole("button", { name: "workplace.add" }));

    await waitFor(() => {
      expect(tasks.createTask).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith("Could not save changes");
    });
  });
});

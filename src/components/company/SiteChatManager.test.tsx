import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { SiteChatManager } from "./SiteChatManager";

const createSiteChat = vi.hoisted(() => vi.fn());
const toastSuccess = vi.hoisted(() => vi.fn());
const toastError = vi.hoisted(() => vi.fn());

vi.mock("../../store", () => ({
  useAppStore: (selector: any) => {
    if (typeof selector !== "function") return undefined;
    return selector({
      siteChats: [{ id: "sc_1", name: "Sales Chat", snippet: "<script src=\"embed.js\"></script>" }],
      createSiteChat,
    });
  },
}));

vi.mock("../../lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string) =>
      (key === "company.e2eAnonymous" ? "E2E encrypted · anonymous visitors" : (fallback ?? key)) as string,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: toastSuccess,
    error: toastError,
  },
}));

describe("SiteChatManager", () => {
  beforeEach(() => {
    createSiteChat.mockReset();
    toastSuccess.mockClear();
    toastError.mockClear();
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });

  it("creates a site chat and shows a success toast", async () => {
    createSiteChat.mockResolvedValue({ id: "sc_2" });
    render(<SiteChatManager />);

    const input = screen.getByPlaceholderText("Site chat name (e.g. Sales)");
    fireEvent.change(input, { target: { value: "Support" } });
    fireEvent.click(screen.getByRole("button", { name: /Create/ }));

    await waitFor(() => expect(createSiteChat).toHaveBeenCalledWith("Support"));
    expect(toastSuccess).toHaveBeenCalledWith("Site chat created — copy the embed snippet");
    expect(input).toHaveValue("");
  });

  it("does not create when name is blank", () => {
    createSiteChat.mockResolvedValue(null);
    render(<SiteChatManager />);
    fireEvent.click(screen.getByRole("button", { name: /Create/ }));
    expect(createSiteChat).not.toHaveBeenCalled();
  });

  it("shows an error toast when creation fails", async () => {
    createSiteChat.mockResolvedValue(null);
    render(<SiteChatManager />);
    fireEvent.change(screen.getByPlaceholderText("Site chat name (e.g. Sales)"), { target: { value: "Sales" } });
    fireEvent.click(screen.getByRole("button", { name: /Create/ }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Create a company first"));
  });

  it("renders existing chats with snippet and copies it", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    render(<SiteChatManager />);

    expect(screen.getByText("Sales Chat")).toBeInTheDocument();
    expect(screen.getByText("E2E encrypted · anonymous visitors")).toBeInTheDocument();

    const textarea = screen.getByText("<script src=\"embed.js\"></script>") as HTMLTextAreaElement;
    expect(textarea).toHaveAttribute("readonly");

    fireEvent.click(screen.getByRole("button", { name: /Copy snippet/ }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("<script src=\"embed.js\"></script>"));
    expect(toastSuccess).toHaveBeenCalledWith("Copied");
  });
});

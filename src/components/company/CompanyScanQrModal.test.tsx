import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { CompanyScanQrModal } from "./CompanyScanQrModal";

vi.mock("@yudiel/react-qr-scanner", () => ({
  Scanner: () => null,
}));

describe("CompanyScanQrModal", () => {
  it("renders title and description", () => {
    render(
      <CompanyScanQrModal
        isDark
        title="Scan QR code"
        description="Point the camera at the invite QR"
        onClose={() => {}}
        onScanResult={() => {}}
      />,
    );
    expect(screen.getByText("Scan QR code")).toBeInTheDocument();
    expect(screen.getByText("Point the camera at the invite QR")).toBeInTheDocument();
  });

  it("closes via the close button", () => {
    const onClose = vi.fn();
    render(
      <CompanyScanQrModal isDark title="Scan" description="desc" onClose={onClose} onScanResult={() => {}} />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on backdrop click but not on panel click", () => {
    const onClose = vi.fn();
    const { container } = render(
      <CompanyScanQrModal isDark title="Scan" description="desc" onClose={onClose} onScanResult={() => {}} />,
    );
    const backdrop = container.firstChild as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);

    onClose.mockClear();
    const panel = container.querySelector(".shadow-2xl") as HTMLElement;
    fireEvent.click(panel);
    expect(onClose).not.toHaveBeenCalled();
  });
});

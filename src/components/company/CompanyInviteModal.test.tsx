import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { CompanyInviteModal } from "./CompanyInviteModal";

vi.mock("../QrCode", () => ({
  QrCode: () => null,
}));

const payload = { org: "org_test123", secret: "abc" } as any;

describe("CompanyInviteModal", () => {
  it("renders title and description", () => {
    render(
      <CompanyInviteModal
        isDark
        title="Invite members"
        description="Share this QR code"
        invitePayload={payload}
        companyId="org_test123"
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("Invite members")).toBeInTheDocument();
    expect(screen.getByText("Share this QR code")).toBeInTheDocument();
  });

  it("shows payload org id when payload present", () => {
    render(
      <CompanyInviteModal
        isDark
        title="Invite"
        description="desc"
        invitePayload={payload}
        companyId="org_fallback"
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("org_test123")).toBeInTheDocument();
  });

  it("falls back to companyId when payload is null", () => {
    render(
      <CompanyInviteModal
        isDark
        title="Invite"
        description="desc"
        invitePayload={null}
        companyId="org_fallback"
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("org_fallback")).toBeInTheDocument();
  });

  it("closes on button click", () => {
    const onClose = vi.fn();
    render(
      <CompanyInviteModal isDark title="Invite" description="desc" invitePayload={null} companyId={null} onClose={onClose} />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

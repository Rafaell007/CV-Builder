import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { VerifyEmailPage } from "./VerifyEmailPage";

// The real router needs the Next.js app router, which tests do not have.
vi.mock("@/shared/i18n", async (importOriginal) =>
  (await import("@/shared/testing/withMockedRouter")).withMockedRouter(
    await importOriginal<typeof import("@/shared/i18n")>(),
    () => ({ push: vi.fn(), replace: vi.fn() }),
  ),
);

describe("VerifyEmailPage", () => {
  it("shows the title, the instruction and the form", () => {
    renderWithProviders(<VerifyEmailPage />);

    expect(screen.getByRole("heading", { name: "Email verification" })).toBeInTheDocument();
    expect(
      screen.getByText("Enter the verification code we sent to your email."),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("textbox")).toHaveLength(6);
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Resend code" })).toBeInTheDocument();
  });
});

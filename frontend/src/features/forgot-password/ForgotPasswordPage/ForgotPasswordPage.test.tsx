import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { ForgotPasswordPage } from "./ForgotPasswordPage";

describe("ForgotPasswordPage", () => {
  it("shows the title, the subtitle and the form", () => {
    renderWithProviders(<ForgotPasswordPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Forgot password" })).toBeInTheDocument();
    expect(
      screen.getByText("We will send you an email with further instructions"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset password" })).toBeInTheDocument();
  });

  it("shows the page in Polish", () => {
    renderWithProviders(<ForgotPasswordPage />, { locale: "pl" });

    expect(screen.getByRole("heading", { level: 1 })).not.toHaveTextContent("Forgot password");
  });
});

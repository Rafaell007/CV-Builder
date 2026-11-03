import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { ResetPasswordPage } from "./ResetPasswordPage";

describe("ResetPasswordPage", () => {
  it("shows the title, the subtitle and the form when the link has a token", () => {
    renderWithProviders(<ResetPasswordPage token="abc" />);

    expect(screen.getByRole("heading", { name: "Reset password" })).toBeInTheDocument();
    expect(
      screen.getByText("Here you should write a new password and confirm it"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("New Password")).toBeInTheDocument();
  });

  it.each([undefined, ""])(
    "shows the invalid-link notice instead of the form for token %j",
    (token) => {
      renderWithProviders(<ResetPasswordPage token={token} />);

      expect(screen.getByRole("alert")).toHaveTextContent("This password reset link is invalid");
      expect(screen.queryByLabelText("New Password")).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Request a new link" })).toBeInTheDocument();
    },
  );
});

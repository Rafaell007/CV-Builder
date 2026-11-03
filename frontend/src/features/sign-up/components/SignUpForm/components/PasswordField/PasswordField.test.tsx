import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { PasswordField } from "./index";

describe("PasswordField", () => {
  it("masks the value by default", () => {
    renderWithProviders(<PasswordField label="Password" />);

    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
  });

  it("shows and hides the value with the toggle", async () => {
    const { user } = renderWithProviders(<PasswordField label="Password" defaultValue="secret1" />);
    const input = screen.getByLabelText("Password");

    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(input).toHaveAttribute("type", "password");
  });

  it("toggles each field on its own and names the button after the field", async () => {
    const { user } = renderWithProviders(
      <>
        <PasswordField label="Password" />
        <PasswordField label="Confirm Password" />
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Show confirm password" }));

    expect(screen.getByLabelText("Confirm Password")).toHaveAttribute("type", "text");
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
  });

  it("passes the error on to the field", () => {
    renderWithProviders(<PasswordField label="Password" error="Password is required" />);

    expect(screen.getByRole("alert")).toHaveTextContent("Password is required");
  });
});

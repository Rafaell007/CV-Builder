import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { TextField } from "./index";

describe("TextField", () => {
  it("is found by its label and takes input", async () => {
    const { user } = renderWithProviders(<TextField label="Email" />);

    const input = screen.getByLabelText("Email");
    await user.type(input, "a@b.co");

    expect(input).toHaveValue("a@b.co");
  });

  it("is valid when there is no error", () => {
    renderWithProviders(<TextField label="Email" />);

    expect(screen.getByLabelText("Email")).not.toHaveAttribute("aria-invalid");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the error, marks the input invalid and links the two", () => {
    renderWithProviders(<TextField label="Email" error="Email is required" />);

    const input = screen.getByLabelText("Email");
    const alert = screen.getByRole("alert");

    expect(alert).toHaveTextContent("Email is required");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Email is required");
  });
});

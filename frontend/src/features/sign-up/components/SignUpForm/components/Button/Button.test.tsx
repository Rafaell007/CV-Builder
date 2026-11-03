import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { Button, ButtonLink } from "./index";

describe("Button", () => {
  it("calls onClick", async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(<Button onClick={onClick}>Save</Button>);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is a button that does not submit a form unless asked", () => {
    renderWithProviders(<Button>Save</Button>);

    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("while loading is busy and cannot be clicked", async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Save" });
    await user.click(button);

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(onClick).not.toHaveBeenCalled();
  });

  it("can be disabled", () => {
    renderWithProviders(<Button disabled>Save</Button>);

    expect(screen.getByRole("button")).toBeDisabled();
  });
});

describe("ButtonLink", () => {
  it("is a link to the given address", () => {
    renderWithProviders(<ButtonLink href="/sign-in">I have an account</ButtonLink>);

    expect(screen.getByRole("link", { name: "I have an account" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
  });
});

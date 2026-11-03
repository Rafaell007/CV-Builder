import Link from "next/link";
import type { FormEvent } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { Button } from "./Button";

describe("Button", () => {
  it("renders a button that does not submit forms unless asked to", () => {
    renderWithProviders(<Button>Update</Button>);

    expect(screen.getByRole("button", { name: "Update" })).toHaveAttribute("type", "button");
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(<Button onClick={onClick}>Update</Button>);

    await user.click(screen.getByRole("button", { name: "Update" }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not call onClick when disabled", async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(
      <Button disabled onClick={onClick}>
        Update
      </Button>,
    );

    await user.click(screen.getByRole("button", { name: "Update" }));

    expect(onClick).not.toHaveBeenCalled();
  });

  describe("while loading", () => {
    it("announces busy, stays focusable and keeps its label", async () => {
      const { user } = renderWithProviders(<Button loading>Update</Button>);
      const button = screen.getByRole("button", { name: "Update" });

      await user.tab();

      expect(button).toHaveAttribute("aria-busy", "true");
      expect(button).toHaveAttribute("aria-disabled", "true");
      expect(button).toBeEnabled();
      expect(button).toHaveFocus();
    });

    it("ignores clicks", async () => {
      const onClick = vi.fn();
      const { user } = renderWithProviders(
        <Button loading onClick={onClick}>
          Update
        </Button>,
      );

      await user.click(screen.getByRole("button", { name: "Update" }));

      expect(onClick).not.toHaveBeenCalled();
    });

    it.each([
      { loading: false, submits: 1 },
      { loading: true, submits: 0 },
    ])(
      "submits its form $submits time(s) when loading is $loading",
      async ({ loading, submits }) => {
        const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
        const { user } = renderWithProviders(
          <form onSubmit={onSubmit}>
            <Button type="submit" loading={loading}>
              Sign in
            </Button>
          </form>,
        );

        await user.click(screen.getByRole("button", { name: "Sign in" }));

        expect(onSubmit).toHaveBeenCalledTimes(submits);
      },
    );
  });

  it("gives its child the button look when asChild", () => {
    renderWithProviders(
      <Button asChild variant="ghost">
        <Link href="/en/forgot-password">Forgot password</Link>
      </Button>,
    );

    expect(screen.getByRole("link", { name: "Forgot password" })).toHaveAttribute(
      "href",
      "/en/forgot-password",
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

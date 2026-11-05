import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { CloseButton } from "./CloseButton";

describe("CloseButton", () => {
  it("is named by aria-label, with the cross hidden from screen readers", () => {
    const { container } = renderWithProviders(<CloseButton aria-label="Close" />);

    expect(screen.getByRole("button", { name: "Close" })).toHaveAttribute("type", "button");
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("can be used from the keyboard", async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(<CloseButton aria-label="Close" onClick={onClick} />);

    await user.tab();
    await user.keyboard("{Enter}");

    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    expect(onClick).toHaveBeenCalledOnce();
  });
});

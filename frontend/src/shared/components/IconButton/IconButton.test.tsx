import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { MoreVertIcon } from "../icons";
import { IconButton } from "./IconButton";

describe("IconButton", () => {
  it("is named by aria-label, with the icon hidden from screen readers", () => {
    const { container } = renderWithProviders(
      <IconButton aria-label="Open menu">
        <MoreVertIcon />
      </IconButton>,
    );

    expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute("type", "button");
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("can be used from the keyboard", async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(
      <IconButton aria-label="Open menu" onClick={onClick}>
        <MoreVertIcon />
      </IconButton>,
    );

    await user.tab();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");

    expect(screen.getByRole("button", { name: "Open menu" })).toHaveFocus();
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("does not call onClick when disabled", async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(
      <IconButton aria-label="Open menu" disabled onClick={onClick}>
        <MoreVertIcon />
      </IconButton>,
    );

    await user.click(screen.getByRole("button", { name: "Open menu" }));

    expect(onClick).not.toHaveBeenCalled();
  });
});

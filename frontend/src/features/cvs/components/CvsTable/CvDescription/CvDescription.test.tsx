import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { CvDescription } from "./CvDescription";

// jsdom has no layout, so the heights that tell "the text is cut" are set by hand.
const mockHeights = (scrollHeight: number, clientHeight: number) => {
  vi.spyOn(Element.prototype, "scrollHeight", "get").mockReturnValue(scrollHeight);
  vi.spyOn(Element.prototype, "clientHeight", "get").mockReturnValue(clientHeight);
};

describe("CvDescription", () => {
  afterEach(() => vi.restoreAllMocks());

  it("is plain text when nothing is cut", () => {
    mockHeights(48, 48);
    renderWithProviders(<CvDescription text="A short text" />);

    expect(screen.getByText("A short text")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("A short text")).not.toHaveAttribute("data-toggleable");
  });

  it("is a button when the text is cut", () => {
    mockHeights(120, 60);
    renderWithProviders(<CvDescription text="A long text" />);

    const description = screen.getByRole("button", { name: "A long text" });
    expect(description).toHaveAttribute("aria-expanded", "false");
    expect(description).toHaveAttribute("data-toggleable");
  });

  it("shows all the text on a click and cuts it again on the next click", async () => {
    mockHeights(120, 60);
    const user = userEvent.setup();
    renderWithProviders(<CvDescription text="A long text" />);
    const description = screen.getByRole("button");

    await user.click(description);
    expect(description).toHaveAttribute("aria-expanded", "true");
    expect(description).toHaveAttribute("data-expanded");

    await user.click(description);
    expect(description).toHaveAttribute("aria-expanded", "false");
    expect(description).not.toHaveAttribute("data-expanded");
  });

  it("toggles with Enter and Space", async () => {
    mockHeights(120, 60);
    const user = userEvent.setup();
    renderWithProviders(<CvDescription text="A long text" />);
    const description = screen.getByRole("button");

    description.focus();
    await user.keyboard("{Enter}");
    expect(description).toHaveAttribute("aria-expanded", "true");
    await user.keyboard(" ");
    expect(description).toHaveAttribute("aria-expanded", "false");
  });
});

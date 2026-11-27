import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { PageState } from "./PageState";

describe("PageState", () => {
  it("shows a busy skeleton while loading", () => {
    const { container } = renderWithProviders(<PageState kind="loading" rows={3} />);

    expect(screen.getByRole("status", { name: "Loading" })).toHaveAttribute("aria-busy", "true");
    expect(container.querySelector('[aria-busy="true"]')?.children).toHaveLength(3);
  });

  it("shows the empty text", () => {
    renderWithProviders(<PageState kind="empty" />);

    expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
  });

  it("shows the no results text, which is not an alert", () => {
    renderWithProviders(<PageState kind="no-results" />);

    expect(screen.getByText("No results found")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the error as an alert with a retry button", async () => {
    const onRetry = vi.fn();
    const { user } = renderWithProviders(<PageState kind="error" onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("shows no retry button when there is no onRetry", () => {
    renderWithProviders(<PageState kind="error" />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("uses the given labels", () => {
    renderWithProviders(
      <PageState kind="error" onRetry={vi.fn()} labels={{ error: "Failed to load CVs" }} />,
    );

    expect(screen.getByText("Failed to load CVs")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});

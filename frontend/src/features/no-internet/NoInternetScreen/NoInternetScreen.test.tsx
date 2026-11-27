import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { NoInternetScreen } from "./NoInternetScreen";

describe("NoInternetScreen", () => {
  it("announces the title and the two-line message", () => {
    renderWithProviders(<NoInternetScreen onRetry={() => {}} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "OopsSomething went wrong. We’re already working on fixing it.Please try again or go back.",
    );
    expect(screen.getByRole("heading", { level: 1, name: "Oops" })).toBeInTheDocument();
  });

  it("calls onRetry when RETRY is clicked", async () => {
    const onRetry = vi.fn();
    const { user } = renderWithProviders(<NoInternetScreen onRetry={onRetry} />);

    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows the Polish texts", () => {
    renderWithProviders(<NoInternetScreen onRetry={() => {}} />, { locale: "pl" });

    expect(screen.getByRole("heading", { level: 1, name: "Ups" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Spróbuj ponownie" })).toBeInTheDocument();
  });
});

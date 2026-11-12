import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { NoInternetState } from "./NoInternetState";

const props = {
  title: "Oops",
  message: "Something went wrong. Please try again or go back.",
  retryLabel: "Retry",
};

describe("NoInternetState", () => {
  it("announces the heading and the message as an alert", () => {
    renderWithProviders(<NoInternetState {...props} onRetry={vi.fn()} />);

    expect(screen.getByRole("heading", { level: 1, name: "Oops" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(`Oops${props.message}`);
  });

  it("repeats the request when RETRY is clicked", async () => {
    const onRetry = vi.fn();
    const { user } = renderWithProviders(<NoInternetState {...props} onRetry={onRetry} />);

    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

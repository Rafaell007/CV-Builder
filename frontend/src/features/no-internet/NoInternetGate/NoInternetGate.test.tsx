import { act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { reportRequestFailure, resetNetworkStatus } from "@/shared/network/store";
import { renderWithProviders, screen } from "@/shared/testing";
import { NoInternetGate } from "./NoInternetGate";

afterEach(() => {
  resetNetworkStatus();
  vi.unstubAllGlobals();
});

describe("NoInternetGate", () => {
  it("shows only the page while the server can be reached", () => {
    renderWithProviders(
      <NoInternetGate>
        <p>Page content</p>
      </NoInternetGate>,
    );

    expect(screen.getByText("Page content")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the screen over the page when the browser goes offline", () => {
    renderWithProviders(<NoInternetGate>Page content</NoInternetGate>);

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Oops");
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("shows the screen when a request fails and reloads the page on RETRY", async () => {
    const reload = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload });
    const { user } = renderWithProviders(<NoInternetGate>Page content</NoInternetGate>);

    act(() => reportRequestFailure());
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(reload).toHaveBeenCalledOnce();
  });
});

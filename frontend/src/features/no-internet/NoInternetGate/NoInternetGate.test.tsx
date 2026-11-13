import { act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearQueryFailed, markQueryFailed } from "@/shared/network";
import { renderWithProviders, screen } from "@/shared/testing";
import { NoInternetGate } from "./NoInternetGate";

const retry = vi.fn();
// RETRY itself (refetch + clear) is tested in useRetryQueries.
vi.mock("../useRetryQueries", () => ({ useRetryQueries: () => retry }));

function stubOnline(online: boolean) {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(online);
}

function goOffline() {
  act(() => {
    stubOnline(false);
    window.dispatchEvent(new Event("offline"));
  });
}

beforeEach(() => {
  stubOnline(true);
});

afterEach(() => {
  act(() => clearQueryFailed());
  vi.restoreAllMocks();
  retry.mockClear();
});

// jsdom does not apply the CSS that hides the page: that is checked in the E2E test.
describe("NoInternetGate", () => {
  it("renders only the page while online", () => {
    renderWithProviders(<NoInternetGate>Page content</NoInternetGate>);

    expect(screen.getByText("Page content")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("announces the No Internet screen when the browser goes offline", () => {
    renderWithProviders(<NoInternetGate>Page content</NoInternetGate>);

    goOffline();

    // The screen's texts are tested in NoInternetScreen.
    expect(screen.getByRole("heading", { level: 1, name: "Oops" })).toBeInTheDocument();
  });

  it("shows the screen when a query failed", () => {
    renderWithProviders(<NoInternetGate>Page content</NoInternetGate>);

    act(() => markQueryFailed());

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("keeps the page mounted behind the screen, so typed text survives", () => {
    renderWithProviders(<NoInternetGate>Page content</NoInternetGate>);

    goOffline();

    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("runs RETRY when the button is clicked", async () => {
    const { user } = renderWithProviders(<NoInternetGate>Page content</NoInternetGate>);
    act(() => markQueryFailed());

    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("hides the screen again when the browser is back online", () => {
    renderWithProviders(<NoInternetGate>Page content</NoInternetGate>);
    goOffline();

    act(() => {
      stubOnline(true);
      window.dispatchEvent(new Event("online"));
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

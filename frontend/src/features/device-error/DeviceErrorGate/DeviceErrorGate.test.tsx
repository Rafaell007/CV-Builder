import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { DeviceErrorGate } from "./DeviceErrorGate";

// jsdom does not apply media queries: the 767/768 switch is checked in the story and the E2E test.
describe("DeviceErrorGate", () => {
  it("renders the page", () => {
    renderWithProviders(
      <DeviceErrorGate>
        <p>Page content</p>
      </DeviceErrorGate>,
    );

    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("renders the device error with its heading and message", () => {
    renderWithProviders(<DeviceErrorGate>Page content</DeviceErrorGate>);

    expect(screen.getByRole("heading", { level: 1, name: "Oops" })).toBeInTheDocument();
    expect(screen.getByText(/supported on mobile devices/)).toHaveTextContent(
      "This app isn’t supported on mobile devices.Please open it on a desktop or tablet to continue.",
    );
  });

  it("has no button and is not announced as an alert", () => {
    renderWithProviders(<DeviceErrorGate>Page content</DeviceErrorGate>);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

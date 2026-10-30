import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HealthStatus } from "./HealthStatus";

describe("HealthStatus", () => {
  it("shows where the status was fetched and its value", () => {
    render(<HealthStatus source="server" status="ok" />);

    expect(screen.getByText("Backend health (server): ok")).toBeDefined();
  });
});

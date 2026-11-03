import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { HealthStatus } from "./HealthStatus";

describe("HealthStatus", () => {
  it("shows where the status was fetched and its value", () => {
    renderWithProviders(<HealthStatus source="server" status="ok" />);

    expect(screen.getByText("Backend health (server): ok")).toBeInTheDocument();
  });

  it("shows the text in Polish", () => {
    renderWithProviders(<HealthStatus source="client" status="ok" />, { locale: "pl" });

    expect(screen.getByText("Stan backendu (klient): ok")).toBeInTheDocument();
  });
});

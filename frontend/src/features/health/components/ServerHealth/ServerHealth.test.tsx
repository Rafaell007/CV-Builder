import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { ServerHealth } from "./ServerHealth";

const query = vi.hoisted(() => vi.fn());

vi.mock("@/shared/apollo/server", () => ({ query }));
// Server-only translation function; the key is enough, the status text comes from HealthStatus.
vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));

describe("ServerHealth", () => {
  beforeEach(() => {
    query.mockReset();
  });

  it("shows the status returned by the server query", async () => {
    query.mockResolvedValue({ data: { health: { status: "ok" } } });

    renderWithProviders(await ServerHealth());

    expect(screen.getByText("Backend health (server): ok")).toBeInTheDocument();
  });

  it("shows the unavailable text when the query returns no data", async () => {
    query.mockResolvedValue({ data: undefined });

    renderWithProviders(await ServerHealth());

    expect(screen.getByText("Backend health (server): unavailable")).toBeInTheDocument();
  });
});

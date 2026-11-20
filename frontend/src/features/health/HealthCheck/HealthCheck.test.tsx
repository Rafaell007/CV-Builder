import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { HealthCheck } from "./HealthCheck";

const connection = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("next/server", () => ({ connection }));
// The real parts fetch from the backend; the tests of those parts live next to them.
vi.mock("@/shared/apollo/server", () => ({
  PreloadQuery: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("../components/ServerHealth", () => ({ ServerHealth: () => <p>server part</p> }));
vi.mock("../components/ClientHealth", () => ({ ClientHealth: () => <p>client part</p> }));

describe("HealthCheck", () => {
  it("waits for the request, then shows the server part and the preloaded client part", async () => {
    renderWithProviders(await HealthCheck());

    expect(connection).toHaveBeenCalledOnce();
    expect(screen.getByText("server part")).toBeInTheDocument();
    expect(screen.getByText("client part")).toBeInTheDocument();
  });
});

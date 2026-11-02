import { Suspense } from "react";
import { describe, expect, it } from "vitest";
import { HealthDocument } from "@/shared/graphql";
import { act, renderWithProviders, screen } from "@/shared/testing";
import { ClientHealth } from "./ClientHealth";

const healthMock = {
  request: { query: HealthDocument },
  result: { data: { health: { __typename: "Health", status: "ok" } } },
};

describe("ClientHealth", () => {
  it("shows the status returned by the health query", async () => {
    // ClientHealth suspends while the query loads; React 19 needs an awaited act() to resume it.
    await act(async () => {
      renderWithProviders(
        <Suspense fallback={<p>Loading</p>}>
          <ClientHealth />
        </Suspense>,
        { mocks: [healthMock] },
      );
    });

    expect(await screen.findByText("Backend health (client): ok")).toBeInTheDocument();
  });
});

import { MockedProvider } from "@apollo/client/testing/react";
import { act, render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { describe, expect, it } from "vitest";
import { HealthDocument } from "@/shared/graphql";
import { ClientHealth } from "./ClientHealth";

const healthMock = {
  request: { query: HealthDocument },
  result: { data: { health: { __typename: "Health", status: "ok" } } },
};

describe("ClientHealth", () => {
  it("shows the status returned by the health query", async () => {
    // ClientHealth suspends while the query loads; React 19 needs an awaited act() to resume it.
    await act(async () => {
      render(
        <MockedProvider mocks={[healthMock]}>
          <Suspense fallback={<p>Loading</p>}>
            <ClientHealth />
          </Suspense>
        </MockedProvider>,
      );
    });

    expect(await screen.findByText("Backend health (client): ok")).toBeDefined();
  });
});

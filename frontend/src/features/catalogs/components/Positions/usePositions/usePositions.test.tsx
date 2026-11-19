import { act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  defaultVariables,
  positionsErrorMock,
  positionsMock,
  developer,
  designer,
  variablesFor,
} from "../positions.mocks";
import { usePositions } from "./usePositions";

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions, variables = defaultVariables) {
  let current!: ReturnType<typeof usePositions>;
  function Probe(): ReactNode {
    current = usePositions(variables);
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

describe("usePositions", () => {
  it("is loading first, then returns the positions of the backend", async () => {
    const { result } = setup({ mocks: [positionsMock([developer, designer])] });

    expect(result().loading).toBe(true);
    await waitFor(() => expect(result().loading).toBe(false));

    expect(result().items.map((position) => position.name)).toEqual(["Developer", "Designer"]);
    expect(result().failed).toBe(false);
  });

  it("sends the search, the sort and the page to the backend and returns its total", async () => {
    const variables = variablesFor({
      page: { number: 2, size: 10 },
      search: "des",
      sort: { field: "name", direction: "DESC" },
    });
    // The mock answers only a request with exactly these variables.
    const { result } = setup(
      { mocks: [positionsMock([designer], { variables, total: 11 })] },
      variables,
    );

    await waitFor(() => expect(result().loading).toBe(false));

    expect(result().items).toEqual([designer]);
    expect(result().total).toBe(11);
  });

  it("reports a failed request and returns no positions", async () => {
    const { result } = setup({ mocks: [positionsErrorMock()] });

    await waitFor(() => expect(result().failed).toBe(true));

    expect(result().items).toEqual([]);
  });

  it("loads the positions again on retry", async () => {
    const { result } = setup({
      mocks: [positionsErrorMock(), positionsMock([developer])],
    });
    await waitFor(() => expect(result().failed).toBe(true));

    act(() => result().retry());

    await waitFor(() => expect(result().failed).toBe(false));
    expect(result().items).toHaveLength(1);
  });
});

import { act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  defaultVariables,
  postgres,
  react,
  skillsErrorMock,
  skillsMock,
  variablesFor,
} from "../skills.mocks";
import { useSkills } from "./useSkills";

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions, variables = defaultVariables) {
  let current!: ReturnType<typeof useSkills>;
  function Probe(): ReactNode {
    current = useSkills(variables);
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

describe("useSkills", () => {
  it("is loading first, then returns the skills of the backend with their category and type", async () => {
    const { result } = setup({ mocks: [skillsMock([react, postgres])] });

    expect(result().loading).toBe(true);
    await waitFor(() => expect(result().loading).toBe(false));

    expect(result().items).toEqual([react, postgres]);
    expect(result().items[1]?.category).toMatchObject({ name: "Databases", type: "Technology" });
    expect(result().failed).toBe(false);
  });

  it("sends the search, the sort and the page to the backend and returns its total", async () => {
    const variables = variablesFor({
      page: { number: 2, size: 10 },
      search: "post",
      sort: { field: "name", direction: "DESC" },
    });
    // The mock answers only a request with exactly these variables.
    const { result } = setup(
      { mocks: [skillsMock([postgres], { variables, total: 11 })] },
      variables,
    );

    await waitFor(() => expect(result().loading).toBe(false));

    expect(result().items).toEqual([postgres]);
    expect(result().total).toBe(11);
  });

  it("reports a failed request and returns no skills", async () => {
    const { result } = setup({ mocks: [skillsErrorMock()] });

    await waitFor(() => expect(result().failed).toBe(true));

    expect(result().items).toEqual([]);
  });

  it("loads the skills again on retry", async () => {
    const { result } = setup({ mocks: [skillsErrorMock(), skillsMock([react])] });
    await waitFor(() => expect(result().failed).toBe(true));

    act(() => result().retry());

    await waitFor(() => expect(result().failed).toBe(false));
    expect(result().items).toHaveLength(1);
  });
});

import { act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  backendCv,
  cvsErrorMock,
  cvsMock,
  defaultVariables,
  frontendCv,
  variablesFor,
} from "../cvs.mocks";
import { useCvs } from "./useCvs";

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions, variables = defaultVariables) {
  let current!: ReturnType<typeof useCvs>;
  function Probe(): ReactNode {
    current = useCvs(variables);
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

describe("useCvs", () => {
  it("is loading first, then returns the CVs of the backend", async () => {
    const { result } = setup({ mocks: [cvsMock([frontendCv, backendCv])] });

    expect(result().loading).toBe(true);
    await waitFor(() => expect(result().loading).toBe(false));

    expect(result().cvs.map((cv) => cv.name)).toEqual(["Frontend Developer", "Backend Engineer"]);
    expect(result().failed).toBe(false);
  });

  it("sends the search, the sort and the page to the backend and returns its total", async () => {
    const variables = variablesFor({
      page: { number: 2, size: 10 },
      search: "jan",
      sort: { field: "name", direction: "DESC" },
    });
    // The mock answers only a request with exactly these variables.
    const { result } = setup(
      { mocks: [cvsMock([backendCv], { variables, total: 11 })] },
      variables,
    );

    await waitFor(() => expect(result().loading).toBe(false));

    expect(result().cvs).toEqual([backendCv]);
    expect(result().total).toBe(11);
  });

  it("sends the user id to the backend when it is given", async () => {
    const variables = variablesFor({ userId: "10" });
    const { result } = setup({ mocks: [cvsMock([frontendCv], { variables })] }, variables);

    await waitFor(() => expect(result().loading).toBe(false));

    expect(result().cvs).toEqual([frontendCv]);
  });

  it("reports a failed request and returns no CVs", async () => {
    const { result } = setup({ mocks: [cvsErrorMock()] });

    await waitFor(() => expect(result().failed).toBe(true));

    expect(result().cvs).toEqual([]);
  });

  it("loads the CVs again on retry", async () => {
    const { result } = setup({ mocks: [cvsErrorMock(), cvsMock([frontendCv])] });
    await waitFor(() => expect(result().failed).toBe(true));

    act(() => result().retry());

    await waitFor(() => expect(result().failed).toBe(false));
    expect(result().cvs).toHaveLength(1);
  });
});

import { act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  defaultVariables,
  departmentsErrorMock,
  departmentsMock,
  engineering,
  finance,
  variablesFor,
} from "../departments.mocks";
import { useDepartments } from "./useDepartments";

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions, variables = defaultVariables) {
  let current!: ReturnType<typeof useDepartments>;
  function Probe(): ReactNode {
    current = useDepartments(variables);
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

describe("useDepartments", () => {
  it("is loading first, then returns the departments of the backend", async () => {
    const { result } = setup({ mocks: [departmentsMock([engineering, finance])] });

    expect(result().loading).toBe(true);
    await waitFor(() => expect(result().loading).toBe(false));

    expect(result().departments.map((department) => department.name)).toEqual([
      "Engineering",
      "Finance",
    ]);
    expect(result().failed).toBe(false);
  });

  it("sends the search, the sort and the page to the backend and returns its total", async () => {
    const variables = variablesFor({
      page: { number: 2, size: 10 },
      search: "fin",
      sort: { field: "name", direction: "DESC" },
    });
    // The mock answers only a request with exactly these variables.
    const { result } = setup(
      { mocks: [departmentsMock([finance], { variables, total: 11 })] },
      variables,
    );

    await waitFor(() => expect(result().loading).toBe(false));

    expect(result().departments).toEqual([finance]);
    expect(result().total).toBe(11);
  });

  it("reports a failed request and returns no departments", async () => {
    const { result } = setup({ mocks: [departmentsErrorMock()] });

    await waitFor(() => expect(result().failed).toBe(true));

    expect(result().departments).toEqual([]);
  });

  it("loads the departments again on retry", async () => {
    const { result } = setup({
      mocks: [departmentsErrorMock(), departmentsMock([engineering])],
    });
    await waitFor(() => expect(result().failed).toBe(true));

    act(() => result().retry());

    await waitFor(() => expect(result().failed).toBe(false));
    expect(result().departments).toHaveLength(1);
  });
});

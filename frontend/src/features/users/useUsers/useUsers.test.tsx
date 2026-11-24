import { act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  alpha,
  bravo,
  defaultVariables,
  emailOnly,
  usersErrorMock,
  usersMock,
  variablesFor,
} from "../users.mocks";
import { useUsers } from "./useUsers";

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions, variables = defaultVariables) {
  let current!: ReturnType<typeof useUsers>;
  function Probe(): ReactNode {
    current = useUsers(variables);
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

describe("useUsers", () => {
  it("is loading first, then returns the users of the backend", async () => {
    const { result } = setup({ mocks: [usersMock([alpha, bravo])] });

    expect(result().loading).toBe(true);
    await waitFor(() => expect(result().loading).toBe(false));

    expect(result().users.map((user) => user.email)).toEqual([alpha.email, bravo.email]);
    expect(result().failed).toBe(false);
  });

  it("keeps a user without name, department or position", async () => {
    const { result } = setup({ mocks: [usersMock([emailOnly])] });

    await waitFor(() => expect(result().loading).toBe(false));

    expect(result().users).toEqual([emailOnly]);
  });

  it("sends the search, the sort and the page to the backend and returns its total", async () => {
    const variables = variablesFor({
      page: { number: 2, size: 10 },
      search: "lima",
      sort: { field: "department", direction: "DESC" },
    });
    // The mock answers only a request with exactly these variables.
    const { result } = setup({ mocks: [usersMock([alpha], { variables, total: 11 })] }, variables);

    await waitFor(() => expect(result().loading).toBe(false));

    expect(result().users).toEqual([alpha]);
    expect(result().total).toBe(11);
  });

  it("reports a failed request and returns no users", async () => {
    const { result } = setup({ mocks: [usersErrorMock()] });

    await waitFor(() => expect(result().failed).toBe(true));

    expect(result().users).toEqual([]);
  });

  it("loads the users again on retry", async () => {
    const { result } = setup({ mocks: [usersErrorMock(), usersMock([alpha])] });
    await waitFor(() => expect(result().failed).toBe(true));

    act(() => result().retry());

    await waitFor(() => expect(result().failed).toBe(false));
    expect(result().users).toHaveLength(1);
  });
});

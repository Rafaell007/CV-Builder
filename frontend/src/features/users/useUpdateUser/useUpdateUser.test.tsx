import { act, waitFor } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import type { UpdateUserInput } from "@/shared/graphql";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  bravo,
  updateUserMock,
  updateUserNetworkErrorMock,
  updateUserRefusedMock,
  usersMock,
  variablesFor,
} from "../users.mocks";
import type { UserListItem } from "../users.types";
import { useUsers } from "../useUsers";
import { useUpdateUser } from "./useUpdateUser";

const input: UpdateUserInput = {
  id: bravo.id,
  firstName: "Bravo",
  lastName: "Victor",
  departmentId: "d3",
  positionId: "p3",
  role: "USER",
};

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions) {
  let current!: ReturnType<typeof useUpdateUser>;
  function Probe(): ReactNode {
    current = useUpdateUser();
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

// The list and the update in one component, with a search the test can change: the user types a search, renames the
// user under another search, and comes back to the first one.
function setupWithList(options: RenderWithProvidersOptions) {
  let current!: {
    list: ReturnType<typeof useUsers>;
    update: ReturnType<typeof useUpdateUser>["update"];
    search: (search: string) => void;
  };
  function Probe(): ReactNode {
    const [search, setSearch] = useState("tango");
    current = {
      list: useUsers(variablesFor({ search })),
      update: useUpdateUser().update,
      search: setSearch,
    };
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

describe("useUpdateUser", () => {
  it("resolves with the user the backend saved", async () => {
    const { result } = setup({ mocks: [updateUserMock(input, bravo.email)] });

    let saved: UserListItem | undefined;
    await act(async () => {
      saved = await result().update(input);
    });

    expect(saved).toMatchObject({
      id: bravo.id,
      lastName: "Victor",
      department: { id: "d3" },
      position: { id: "p3" },
    });
  });

  it("rejects with the backend error, so the form can show the reason and keep its values", async () => {
    const { result } = setup({
      mocks: [updateUserRefusedMock(input, { code: "CONFLICT", reason: "OWN_ROLE" })],
    });

    await act(async () => {
      await expect(result().update(input)).rejects.toMatchObject({
        errors: [expect.objectContaining({ extensions: { code: "CONFLICT", reason: "OWN_ROLE" } })],
      });
    });
  });

  it("rejects with the error of the request when the network fails", async () => {
    const { result } = setup({ mocks: [updateUserNetworkErrorMock(input)] });

    await act(async () => {
      await expect(result().update(input)).rejects.toThrow("Failed to fetch");
    });
  });

  it("loads the open list again when the user was deleted meanwhile, so the row goes away", async () => {
    const tangoSearch = variablesFor({ search: "tango" });
    const { result } = setupWithList({
      mocks: [
        usersMock([bravo], { variables: tangoSearch }),
        updateUserRefusedMock(input, { code: "NOT_FOUND" }),
        // Another admin deleted the user: the backend lists no one now.
        usersMock([], { variables: tangoSearch }),
      ],
    });
    await waitFor(() => expect(result().list.users).toEqual([bravo]));

    await act(async () => {
      await expect(result().update(input)).rejects.toMatchObject({
        errors: [expect.objectContaining({ extensions: { code: "NOT_FOUND" } })],
      });
    });

    await waitFor(() => expect(result().list.users).toEqual([]));
  });

  it("does not keep a stored search result that has the user under the old name", async () => {
    const renamed: UserListItem = { ...bravo, lastName: "Victor" };
    const victorSearch = variablesFor({ search: "victor" });
    const tangoSearch = variablesFor({ search: "tango" });
    const { result } = setupWithList({
      mocks: [
        usersMock([bravo], { variables: tangoSearch }),
        usersMock([], { variables: victorSearch }),
        updateUserMock(input, bravo.email),
        // The open list loads again after the update.
        usersMock([renamed], { variables: victorSearch }),
        // The backend finds no user named "Tango" any more.
        usersMock([], { variables: tangoSearch }),
      ],
    });
    await waitFor(() => expect(result().list.users).toEqual([bravo]));

    act(() => result().search("victor"));
    await waitFor(() => expect(result().list.loading).toBe(false));
    await act(async () => {
      await result().update(input);
    });
    act(() => result().search("tango"));

    // The first search is asked again: its stored result had the user under the old name.
    await waitFor(() => expect(result().list.users).toEqual([]));
  });
});

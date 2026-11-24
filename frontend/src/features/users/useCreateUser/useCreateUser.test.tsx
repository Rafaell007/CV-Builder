import { act, waitFor } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import type { CreateUserInput } from "@/shared/graphql";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  alpha,
  createUserMock,
  createUserNetworkErrorMock,
  createUserRefusedMock,
  usersMock,
  variablesFor,
} from "../users.mocks";
import type { UserListItem } from "../users.types";
import { useUsers } from "../useUsers";
import { useCreateUser } from "./useCreateUser";

const input: CreateUserInput = {
  email: "delta.echo@example.com",
  password: "secret123",
  firstName: "Delta",
  lastName: "Echo",
  departmentId: "d1",
  positionId: "p1",
  role: "USER",
};

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions) {
  let current!: ReturnType<typeof useCreateUser>;
  function Probe(): ReactNode {
    current = useCreateUser();
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

// The list and the create in one component, with a search the test can change: a list stored under one search
// must not come back without the new user after a create under another search.
function setupWithList(options: RenderWithProvidersOptions) {
  let current!: {
    list: ReturnType<typeof useUsers>;
    create: ReturnType<typeof useCreateUser>["create"];
    search: (search: string) => void;
  };
  function Probe(): ReactNode {
    const [search, setSearch] = useState("example");
    current = {
      list: useUsers(variablesFor({ search })),
      create: useCreateUser().create,
      search: setSearch,
    };
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

describe("useCreateUser", () => {
  it("resolves with the user the backend created", async () => {
    const { result } = setup({ mocks: [createUserMock(input, { id: "42" })] });

    let created: UserListItem | undefined;
    await act(async () => {
      created = await result().create(input);
    });

    expect(created).toMatchObject({
      id: "42",
      email: "delta.echo@example.com",
      department: { id: "d1" },
      position: { id: "p1" },
    });
  });

  it("rejects with the backend error, so the form can show the reason and keep its values", async () => {
    const { result } = setup({
      mocks: [createUserRefusedMock(input, { code: "CONFLICT", reason: "EMAIL_TAKEN" })],
    });

    await act(async () => {
      await expect(result().create(input)).rejects.toMatchObject({
        errors: [
          expect.objectContaining({ extensions: { code: "CONFLICT", reason: "EMAIL_TAKEN" } }),
        ],
      });
    });
  });

  it("rejects with the error of the request when the network fails", async () => {
    const { result } = setup({ mocks: [createUserNetworkErrorMock(input)] });

    await act(async () => {
      await expect(result().create(input)).rejects.toThrow("Failed to fetch");
    });
  });

  it("does not keep a stored search result that misses the new user", async () => {
    const created: UserListItem = {
      ...alpha,
      id: "new-1",
      email: input.email,
      firstName: "Delta",
      lastName: "Echo",
    };
    const deltaSearch = variablesFor({ search: "delta" });
    const exampleSearch = variablesFor({ search: "example" });
    const { result } = setupWithList({
      mocks: [
        usersMock([alpha], { variables: exampleSearch }),
        usersMock([], { variables: deltaSearch }),
        createUserMock(input),
        // The open list loads again after the create.
        usersMock([created], { variables: deltaSearch }),
        // The first search is asked again and now has the new user too.
        usersMock([alpha, created], { variables: exampleSearch }),
      ],
    });
    await waitFor(() => expect(result().list.users).toEqual([alpha]));

    act(() => result().search("delta"));
    await waitFor(() => expect(result().list.loading).toBe(false));
    await act(async () => {
      await result().create(input);
    });
    act(() => result().search("example"));

    await waitFor(() => expect(result().list.users).toHaveLength(2));
  });
});

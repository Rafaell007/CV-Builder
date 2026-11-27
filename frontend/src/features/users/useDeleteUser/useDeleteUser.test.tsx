import { act, screen, waitFor } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  bravo,
  charlie,
  deleteUserMock,
  deleteUserNetworkErrorMock,
  deleteUserRefusedMock,
  usersMock,
  variablesFor,
  withErrors,
} from "../users.mocks";
import { useUsers } from "../useUsers";
import { useDeleteUser } from "./useDeleteUser";

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions) {
  let current!: ReturnType<typeof useDeleteUser>;
  function Probe(): ReactNode {
    current = useDeleteUser();
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

// The list and the delete in one component, with a search the test can change.
function setupWithList(options: RenderWithProvidersOptions) {
  let current!: {
    list: ReturnType<typeof useUsers>;
    deletion: ReturnType<typeof useDeleteUser>;
    search: (search: string) => void;
  };
  function Probe(): ReactNode {
    const [search, setSearch] = useState("tango");
    current = {
      list: useUsers(variablesFor({ search })),
      deletion: useDeleteUser(),
      search: setSearch,
    };
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

const tangoSearch = variablesFor({ search: "tango" });

describe("useDeleteUser", () => {
  it("holds the chosen user until it is cancelled", () => {
    const { result } = setup({ mocks: [] });
    expect(result().user).toBeNull();

    act(() => result().askToDelete(bravo));
    expect(result().user).toEqual(bravo);

    act(() => result().cancel());
    expect(result().user).toBeNull();
  });

  it("does nothing on confirm when no user is chosen", async () => {
    const { result } = setup({ mocks: [] });

    let deleted = true;
    await act(async () => {
      deleted = await result().confirm();
    });

    expect(deleted).toBe(false);
  });

  it("removes the row, loads the open list again and shows a success toast", async () => {
    const { result } = setupWithList({
      mocks: [
        usersMock([bravo], { variables: tangoSearch }),
        deleteUserMock(bravo.id),
        usersMock([], { variables: tangoSearch }),
      ],
    });
    await waitFor(() => expect(result().list.users).toEqual([bravo]));
    act(() => result().deletion.askToDelete(bravo));

    let deleted = false;
    await act(async () => {
      deleted = await result().deletion.confirm();
    });

    expect(deleted).toBe(true);
    expect(result().deletion.user).toBeNull();
    await waitFor(() => expect(result().list.users).toEqual([]));
    expect(await screen.findByText("User deleted")).toBeInTheDocument();
    expect(screen.getByText("Bravo Tango was removed from the employees.")).toBeInTheDocument();
  });

  it("does not keep a stored list of another search that still has the deleted user", async () => {
    const charlieSearch = variablesFor({ search: "charlie" });
    const { result } = setupWithList({
      mocks: [
        usersMock([bravo], { variables: tangoSearch }),
        usersMock([charlie], { variables: charlieSearch }),
        deleteUserMock(bravo.id),
        // The open list loads again after the delete.
        usersMock([charlie], { variables: charlieSearch }),
        // The backend finds no "Tango" any more.
        usersMock([], { variables: tangoSearch, total: 0 }),
      ],
    });
    await waitFor(() => expect(result().list.users).toEqual([bravo]));
    act(() => result().search("charlie"));
    await waitFor(() => expect(result().list.users).toEqual([charlie]));

    act(() => result().deletion.askToDelete(bravo));
    await act(async () => {
      await result().deletion.confirm();
    });
    act(() => result().search("tango"));

    // The first search is asked again; its stored result still had the deleted user (and its old total).
    await waitFor(() => expect(result().list.total).toBe(0));
  });

  it("sends one request when confirm is called twice in the same tick", async () => {
    // One delete mock: a second request would find no mock and show an error toast.
    const slowDelete = { ...deleteUserMock(bravo.id), delay: 20 };
    const { result } = setup({ mocks: [slowDelete] });
    act(() => result().askToDelete(bravo));

    let results: boolean[] = [];
    await act(async () => {
      results = await Promise.all([result().confirm(), result().confirm()]);
    });

    expect(results).toEqual([true, false]);
    expect(screen.queryByText("Could not delete the user")).not.toBeInTheDocument();
  });

  it.each([
    [{ code: "CONFLICT", reason: "SELF_DELETE" }, "You cannot delete your own account."],
    [{ code: "FORBIDDEN" }, "You do not have permission to do this."],
    [
      { code: "CONFLICT", reason: "CONCURRENT_CHANGE" },
      "Someone changed this user at the same time. Try again.",
    ],
    [{ code: "INTERNAL_SERVER_ERROR" }, "Something went wrong. Please try again."],
  ])(
    "closes and shows a translated text, not the backend message, for %o",
    async (extensions, text) => {
      const { result } = setup({
        mocks: [deleteUserRefusedMock(bravo.id, extensions, "Backend says no")],
      });
      act(() => result().askToDelete(bravo));

      let deleted = true;
      await act(async () => {
        deleted = await result().confirm();
      });

      expect(deleted).toBe(false);
      expect(result().user).toBeNull();
      expect(await screen.findByText("Could not delete the user")).toBeInTheDocument();
      expect(screen.getByText(text)).toBeInTheDocument();
      expect(screen.queryByText("Backend says no")).not.toBeInTheDocument();
    },
  );

  it("loads the open list again when the user was deleted meanwhile, so the row goes away", async () => {
    const { result } = setupWithList({
      mocks: [
        usersMock([bravo], { variables: tangoSearch }),
        deleteUserRefusedMock(bravo.id, { code: "NOT_FOUND" }),
        // Another admin deleted the user: the backend lists no one now.
        usersMock([], { variables: tangoSearch }),
      ],
    });
    await waitFor(() => expect(result().list.users).toEqual([bravo]));
    act(() => result().deletion.askToDelete(bravo));

    await act(async () => {
      await result().deletion.confirm();
    });

    expect(await screen.findByText("This user no longer exists.")).toBeInTheDocument();
    await waitFor(() => expect(result().list.users).toEqual([]));
  });

  it("shows the text of the NOT_FOUND error when it is not the first error of the response", async () => {
    const { result } = setup({
      mocks: [
        withErrors(deleteUserMock(bravo.id), [
          { code: "CONFLICT", reason: "SELF_DELETE" },
          { code: "NOT_FOUND" },
        ]),
      ],
    });
    act(() => result().askToDelete(bravo));

    await act(async () => {
      await result().confirm();
    });

    expect(await screen.findByText("This user no longer exists.")).toBeInTheDocument();
    expect(screen.queryByText("You cannot delete your own account.")).not.toBeInTheDocument();
  });

  it("shows the friendly text and no network message when the request fails", async () => {
    const { result } = setup({ mocks: [deleteUserNetworkErrorMock(bravo.id)] });
    act(() => result().askToDelete(bravo));

    await act(async () => {
      await result().confirm();
    });

    expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
    expect(screen.queryByText(/Failed to fetch/)).not.toBeInTheDocument();
  });
});

import { act, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  cvToDelete,
  deleteCvMock,
  deleteCvNetworkErrorMock,
  deleteCvRefusedMock,
} from "./deleteCv.mocks";
import { useDeleteCv, type UseDeleteCvOptions } from "./useDeleteCv";

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
// The list is on page 1 with 10 rows unless a test says otherwise.
function setup(
  options: RenderWithProvidersOptions,
  list: Partial<Omit<UseDeleteCvOptions, "onPageChange">> = {},
) {
  const onPageChange = vi.fn();
  let current!: ReturnType<typeof useDeleteCv>;
  function Probe(): ReactNode {
    current = useDeleteCv({ page: 1, rowsOnPage: 10, ...list, onPageChange });
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current, onPageChange };
}

const cv = cvToDelete;

describe("useDeleteCv", () => {
  it("holds the chosen CV until it is cancelled", () => {
    const { result } = setup({ mocks: [] });
    expect(result().cv).toBeNull();

    act(() => result().askToDelete(cv));
    expect(result().cv).toEqual(cv);

    act(() => result().cancel());
    expect(result().cv).toBeNull();
  });

  it("does nothing on confirm when no CV is chosen", async () => {
    const { result } = setup({ mocks: [] });

    let deleted = true;
    await act(async () => {
      deleted = await result().confirm();
    });

    expect(deleted).toBe(false);
  });

  it("resolves true and clears the CV after a successful delete", async () => {
    const { result } = setup({ mocks: [deleteCvMock(cv.id)] });
    act(() => result().askToDelete(cv));

    let deleted = false;
    await act(async () => {
      deleted = await result().confirm();
    });

    expect(deleted).toBe(true);
    expect(result().cv).toBeNull();
  });

  it("sends the employee of the User CVs tab with the request", async () => {
    // The mock matches only a request with userId "user-1": a request without it finds no mock and fails.
    const { result } = setup({ mocks: [deleteCvMock(cv.id, "user-1")] }, { userId: "user-1" });
    act(() => result().askToDelete(cv));

    let deleted = false;
    await act(async () => {
      deleted = await result().confirm();
    });

    expect(deleted).toBe(true);
  });

  it("sends one request when confirm is called twice in the same tick", async () => {
    // One delete mock: a second request would find no mock and show an error toast.
    const slowDelete = { ...deleteCvMock(cv.id), delay: 20 };
    const { result } = setup({ mocks: [slowDelete] });
    act(() => result().askToDelete(cv));

    let results: boolean[] = [];
    await act(async () => {
      results = await Promise.all([result().confirm(), result().confirm()]);
    });

    expect(results).toEqual([true, false]);
    expect(screen.queryByText("Could not delete the CV")).not.toBeInTheDocument();
  });

  it("closes and shows the not found text when the CV does not exist", async () => {
    const { result } = setup({ mocks: [deleteCvRefusedMock(cv.id)] });
    act(() => result().askToDelete(cv));

    let deleted = true;
    await act(async () => {
      deleted = await result().confirm();
    });

    expect(deleted).toBe(false);
    expect(result().cv).toBeNull();
    expect(
      await screen.findByText("This CV does not exist any more. The list was updated."),
    ).toBeInTheDocument();
  });

  it("shows the forbidden text, not the backend message, for FORBIDDEN", async () => {
    const { result } = setup({
      mocks: [deleteCvRefusedMock(cv.id, { code: "FORBIDDEN", message: "Raw backend text" })],
    });
    act(() => result().askToDelete(cv));

    await act(async () => {
      await result().confirm();
    });

    expect(await screen.findByText("You are not allowed to delete this CV.")).toBeInTheDocument();
    expect(screen.queryByText("Raw backend text")).not.toBeInTheDocument();
  });

  it("shows the friendly text for any other error code", async () => {
    const { result } = setup({
      mocks: [deleteCvRefusedMock(cv.id, { code: "INTERNAL_SERVER_ERROR", message: "Boom" })],
    });
    act(() => result().askToDelete(cv));

    await act(async () => {
      await result().confirm();
    });

    expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
    expect(screen.queryByText("Boom")).not.toBeInTheDocument();
  });

  it("shows the friendly text and no network message when the request fails", async () => {
    const { result } = setup({ mocks: [deleteCvNetworkErrorMock(cv.id)] });
    act(() => result().askToDelete(cv));

    await act(async () => {
      await result().confirm();
    });

    await waitFor(() =>
      expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument(),
    );
    expect(screen.queryByText(/Failed to fetch/)).not.toBeInTheDocument();
  });

  describe("page after the delete", () => {
    async function deleteWith(list: Parameters<typeof setup>[1], mock = deleteCvMock(cv.id)) {
      const view = setup({ mocks: [mock] }, list);
      act(() => view.result().askToDelete(cv));
      await act(async () => {
        await view.result().confirm();
      });
      return view;
    }

    it("goes back one page after the only CV of page 2 or later is deleted", async () => {
      const { onPageChange } = await deleteWith({ page: 3, rowsOnPage: 1 });

      expect(onPageChange).toHaveBeenCalledExactlyOnceWith(2);
    });

    it("stays on page 1 when its only CV is deleted", async () => {
      const { onPageChange } = await deleteWith({ page: 1, rowsOnPage: 1 });

      expect(onPageChange).not.toHaveBeenCalled();
    });

    it("stays on the page when other CVs remain on it", async () => {
      const { onPageChange } = await deleteWith({ page: 2, rowsOnPage: 2 });

      expect(onPageChange).not.toHaveBeenCalled();
    });

    it("stays on the page when the delete fails", async () => {
      const { onPageChange } = await deleteWith(
        { page: 2, rowsOnPage: 1 },
        deleteCvNetworkErrorMock(cv.id),
      );

      expect(onPageChange).not.toHaveBeenCalled();
    });
  });

  // NOTE (KAN-112): waits for the list page. `confirm` calls `client.refetchQueries` after NOT_FOUND, and this test
  // needs an active `Cvs` query to see that call. Fill it in when the hook is wired into the page: render the page
  // with a `Cvs` mock twice (before and after the delete), delete a CV that answers NOT_FOUND, and expect the second
  // `Cvs` request. Then replace `it.todo` with `it`. See README.delete.md, Notes.
  it.todo("loads the Cvs list again when the CV was not found");
});

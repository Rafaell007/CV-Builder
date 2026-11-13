import { act, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  cvToDelete,
  deleteCvMock,
  deleteCvNetworkErrorMock,
  deleteCvRefusedMock,
} from "./deleteCv.mocks";
import { useDeleteCv } from "./useDeleteCv";

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions) {
  let current!: ReturnType<typeof useDeleteCv>;
  function Probe(): ReactNode {
    current = useDeleteCv();
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
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
});

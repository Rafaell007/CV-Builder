import { act, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  blog,
  deleteProjectMock,
  deleteProjectNetworkErrorMock,
  deleteProjectRefusedMock,
  projectsMock,
} from "../projects.mocks";
import { useDeleteProject } from "./useDeleteProject";

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions) {
  let current!: ReturnType<typeof useDeleteProject>;
  function Probe(): ReactNode {
    current = useDeleteProject();
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

describe("useDeleteProject", () => {
  it("holds the chosen project until it is cancelled", () => {
    const { result } = setup({ mocks: [] });
    expect(result().project).toBeNull();

    act(() => result().askToDelete(blog));
    expect(result().project).toEqual(blog);

    act(() => result().cancel());
    expect(result().project).toBeNull();
  });

  it("does nothing on confirm when no project is chosen", async () => {
    const { result } = setup({ mocks: [] });

    let deleted = true;
    await act(async () => {
      deleted = await result().confirm();
    });

    expect(deleted).toBe(false);
  });

  it("resolves true and clears the project after a successful delete", async () => {
    const { result } = setup({ mocks: [deleteProjectMock(blog.id), projectsMock([])] });
    act(() => result().askToDelete(blog));

    let deleted = false;
    await act(async () => {
      deleted = await result().confirm();
    });

    expect(deleted).toBe(true);
    expect(result().project).toBeNull();
  });

  it("sends one request when confirm is called twice in the same tick", async () => {
    // One delete mock: a second request would find no mock and show an error toast.
    const slowDelete = { ...deleteProjectMock(blog.id), delay: 20 };
    const { result } = setup({ mocks: [slowDelete, projectsMock([])] });
    act(() => result().askToDelete(blog));

    let results: boolean[] = [];
    await act(async () => {
      results = await Promise.all([result().confirm(), result().confirm()]);
    });

    expect(results).toEqual([true, false]);
    expect(screen.queryByText("Could not delete the project")).not.toBeInTheDocument();
  });

  it("closes and shows the translated in-use text, not the backend message, for a CONFLICT", async () => {
    const { result } = setup({
      mocks: [deleteProjectRefusedMock(blog.id, { message: "The project is used in 2 CVs" })],
    });
    act(() => result().askToDelete(blog));

    let deleted = true;
    await act(async () => {
      deleted = await result().confirm();
    });

    expect(deleted).toBe(false);
    expect(result().project).toBeNull();
    expect(
      await screen.findByText("This project cannot be deleted because it is used in a CV."),
    ).toBeInTheDocument();
    expect(screen.queryByText("The project is used in 2 CVs")).not.toBeInTheDocument();
  });

  it("shows the friendly text for an error code that is not CONFLICT", async () => {
    const { result } = setup({
      mocks: [
        deleteProjectRefusedMock(blog.id, { code: "FORBIDDEN", message: "Admin role required" }),
      ],
    });
    act(() => result().askToDelete(blog));

    await act(async () => {
      await result().confirm();
    });

    expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
    expect(screen.queryByText("Admin role required")).not.toBeInTheDocument();
  });

  it("shows the friendly text and no network message when the request fails", async () => {
    const { result } = setup({ mocks: [deleteProjectNetworkErrorMock(blog.id)] });
    act(() => result().askToDelete(blog));

    await act(async () => {
      await result().confirm();
    });

    await waitFor(() =>
      expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument(),
    );
    expect(screen.queryByText(/Failed to fetch/)).not.toBeInTheDocument();
  });
});

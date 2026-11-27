import { act, waitFor } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import type { ProjectListItem } from "../projects.types";
import {
  blog,
  projectsMock,
  updateProjectMock,
  updateProjectNetworkErrorMock,
  variablesFor,
} from "../projects.mocks";
import { useProjects } from "../useProjects";
import { useUpdateProject } from "./useUpdateProject";

const input = {
  id: "1",
  name: "Blog 2",
  domain: "Blogging",
  startDate: "2026-01-10T00:00:00.000Z",
  endDate: "2026-06-30T00:00:00.000Z",
  description: "A blogging site",
  environmentIds: ["10"],
};

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions) {
  let current!: ReturnType<typeof useUpdateProject>;
  function Probe(): ReactNode {
    current = useUpdateProject();
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

// The list and the update in one component, with a search the test can change: the user types a search, renames the
// project under another search, and comes back to the first one.
function setupWithList(options: RenderWithProvidersOptions) {
  let current!: {
    list: ReturnType<typeof useProjects>;
    update: ReturnType<typeof useUpdateProject>["update"];
    search: (search: string) => void;
  };
  function Probe(): ReactNode {
    const [search, setSearch] = useState("Blog");
    current = {
      list: useProjects(variablesFor({ search })),
      update: useUpdateProject().update,
      search: setSearch,
    };
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

describe("useUpdateProject", () => {
  it("resolves with the project the backend saved", async () => {
    const { result } = setup({ mocks: [updateProjectMock(input)] });

    let saved: ProjectListItem | undefined;
    await act(async () => {
      saved = await result().update(input);
    });

    expect(saved).toMatchObject({ id: "1", name: "Blog 2" });
  });

  it("rejects with the error of the request, so the form can keep its values", async () => {
    const { result } = setup({ mocks: [updateProjectNetworkErrorMock(input)] });

    await act(async () => {
      await expect(result().update(input)).rejects.toThrow("Failed to fetch");
    });
  });

  it("does not keep a stored search result that has the project under its old name", async () => {
    const renamed = { ...blog, name: "Blog 2" };
    const renamedSearch = variablesFor({ search: "Blog 2" });
    const { result } = setupWithList({
      mocks: [
        projectsMock([blog], { variables: variablesFor({ search: "Blog" }) }),
        projectsMock([renamed], { variables: renamedSearch }),
        updateProjectMock({ ...input, id: blog.id }),
        // The open list loads again after the update.
        projectsMock([renamed], { variables: renamedSearch }),
        // The backend finds no project named "Blog" any more.
        projectsMock([], { variables: variablesFor({ search: "Blog" }) }),
      ],
    });
    await waitFor(() => expect(result().list.projects).toEqual([blog]));

    act(() => result().search("Blog 2"));
    await waitFor(() => expect(result().list.projects).toEqual([renamed]));
    await act(async () => {
      await result().update({ ...input, id: blog.id });
    });
    act(() => result().search("Blog"));

    // The first search is asked again: its stored result still has the project, now under the new name.
    await waitFor(() => expect(result().list.loading).toBe(false));
    expect(result().list.projects).toEqual([]);
  });
});

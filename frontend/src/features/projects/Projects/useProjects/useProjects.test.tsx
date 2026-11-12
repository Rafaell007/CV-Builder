import { act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import { blog, projectsErrorMock, projectsMock, sales } from "../projects.mocks";
import { useProjects } from "./useProjects";

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions) {
  let current!: ReturnType<typeof useProjects>;
  function Probe(): ReactNode {
    current = useProjects();
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

describe("useProjects", () => {
  it("is loading first, then returns the projects of the backend", async () => {
    const { result } = setup({ mocks: [projectsMock([blog, sales])] });

    expect(result().loading).toBe(true);
    await waitFor(() => expect(result().loading).toBe(false));

    expect(result().projects.map((project) => project.name)).toEqual([
      "Blog",
      "Cloud Sales Management",
    ]);
    expect(result().failed).toBe(false);
  });

  it("reports a failed request and returns no projects", async () => {
    const { result } = setup({ mocks: [projectsErrorMock()] });

    await waitFor(() => expect(result().failed).toBe(true));

    expect(result().projects).toEqual([]);
  });

  it("loads the projects again on retry", async () => {
    const { result } = setup({ mocks: [projectsErrorMock(), projectsMock([blog])] });
    await waitFor(() => expect(result().failed).toBe(true));

    act(() => result().retry());

    await waitFor(() => expect(result().failed).toBe(false));
    expect(result().projects).toHaveLength(1);
  });
});

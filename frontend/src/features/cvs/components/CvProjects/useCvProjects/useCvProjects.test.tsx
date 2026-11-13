import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import type { CvProjectsQueryVariables } from "@/shared/graphql";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import { DEFAULT_CV_PROJECTS_SORT } from "../cvProjects.constants";
import {
  CV_ID,
  cvProjectsMock,
  cvProjectsNetworkErrorMock,
  sampleCvProjects,
} from "../cvProjects.mocks";
import { toCvProjectsVariables } from "../utils";
import { useCvProjects, type UseCvProjectsResult } from "./useCvProjects";

const defaultVariables = toCvProjectsVariables(CV_ID, {
  search: "",
  sort: DEFAULT_CV_PROJECTS_SORT,
});

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(
  options: RenderWithProvidersOptions,
  variables: CvProjectsQueryVariables = defaultVariables,
) {
  let current!: UseCvProjectsResult;
  function Probe(): ReactNode {
    current = useCvProjects(variables);
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

describe("useCvProjects", () => {
  it("is loading, with no projects yet, until the backend answers", () => {
    const { result } = setup({ mocks: [cvProjectsMock()] });

    expect(result()).toMatchObject({ loading: true, projects: undefined, failed: false });
  });

  it("returns the projects of the backend in its order", async () => {
    const { result } = setup({ mocks: [cvProjectsMock()] });

    await expect.poll(() => result().projects).toEqual(sampleCvProjects);
    expect(result()).toMatchObject({ loading: false, failed: false });
  });

  it("sends the search and the sort to the backend (AC-4, AC-6, AC-40)", async () => {
    const variables = toCvProjectsVariables(CV_ID, {
      search: "bank",
      sort: { field: "endDate", direction: "DESC" },
    });
    // The mock answers only a request with exactly these variables.
    const { result } = setup(
      { mocks: [cvProjectsMock([sampleCvProjects[1]!], variables)] },
      variables,
    );

    await expect
      .poll(() => result().projects?.map((item) => item.project.name))
      .toEqual(["Online Bank"]);
  });

  it("reports a failed request, and retry sends it again", async () => {
    const { result } = setup({ mocks: [cvProjectsNetworkErrorMock(), cvProjectsMock()] });

    await expect.poll(() => result().failed).toBe(true);
    expect(result().projects).toBeUndefined();

    result().retry();

    await expect.poll(() => result().projects).toEqual(sampleCvProjects);
    expect(result().failed).toBe(false);
  });
});

import { act } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import type { ProjectListItem } from "../projects.types";
import { updateProjectMock, updateProjectNetworkErrorMock } from "../projects.mocks";
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
});

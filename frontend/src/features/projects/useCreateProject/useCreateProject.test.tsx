import { act } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import type { ProjectListItem } from "../projects.types";
import { createProjectMock, createProjectNetworkErrorMock } from "../projects.mocks";
import { useCreateProject } from "./useCreateProject";

const input = {
  name: "Blog",
  domain: "Blogging",
  startDate: "2026-01-10T00:00:00.000Z",
  endDate: "2026-06-30T00:00:00.000Z",
  description: "A blogging site",
};

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions) {
  let current!: ReturnType<typeof useCreateProject>;
  function Probe(): ReactNode {
    current = useCreateProject();
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

describe("useCreateProject", () => {
  it("resolves with the project the backend created", async () => {
    const { result } = setup({ mocks: [createProjectMock(input, { id: "42" })] });

    let created: ProjectListItem | undefined;
    await act(async () => {
      created = await result().create(input);
    });

    expect(created).toMatchObject({ id: "42", name: "Blog", environment: [] });
  });

  it("rejects with the error of the request, so the form can keep its values", async () => {
    const { result } = setup({ mocks: [createProjectNetworkErrorMock(input)] });

    await act(async () => {
      await expect(result().create(input)).rejects.toThrow("Failed to fetch");
    });
  });
});

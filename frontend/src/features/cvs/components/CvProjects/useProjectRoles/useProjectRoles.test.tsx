import { act } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import { projectRolesMock, projectRolesNetworkErrorMock, sampleRoles } from "../cvProjects.mocks";
import { useProjectRoles, type UseProjectRolesResult } from "./useProjectRoles";

function setup(options: RenderWithProvidersOptions) {
  let current!: UseProjectRolesResult;
  let enable!: () => void;
  function Probe(): ReactNode {
    const [enabled, setEnabled] = useState(false);
    enable = () => setEnabled(true);
    current = useProjectRoles(enabled);
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current, enable: () => act(() => enable()) };
}

describe("useProjectRoles", () => {
  it("asks the backend only after it is enabled, and returns the roles", async () => {
    const { result, enable } = setup({ mocks: [projectRolesMock()] });
    expect(result()).toMatchObject({ roles: undefined, loading: false });

    enable();

    await expect.poll(() => result().roles).toEqual(sampleRoles);
  });

  it("reports a failed request, and retry sends it again", async () => {
    const { result, enable } = setup({
      mocks: [projectRolesNetworkErrorMock(), projectRolesMock()],
    });
    enable();
    await expect.poll(() => result().failed).toBe(true);
    expect(result().roles).toBeUndefined();

    result().retry();

    await expect.poll(() => result().roles).toEqual(sampleRoles);
  });
});

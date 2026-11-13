import { act } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  bank,
  blog,
  projectCatalogMock,
  projectCatalogNetworkErrorMock,
  projectCatalogRefusedMock,
} from "../cvProjects.mocks";
import { useProjectCatalog, type UseProjectCatalogResult } from "./useProjectCatalog";

function setup(options: RenderWithProvidersOptions) {
  let current!: UseProjectCatalogResult;
  let enable!: () => void;
  function Probe(): ReactNode {
    const [enabled, setEnabled] = useState(false);
    enable = () => setEnabled(true);
    current = useProjectCatalog(enabled);
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current, enable: () => act(() => enable()) };
}

describe("useProjectCatalog", () => {
  it("asks the backend only after it is enabled", async () => {
    // No other mock: a request before `enable` would fail the test with an unexpected-request error.
    const { result, enable } = setup({ mocks: [projectCatalogMock()] });
    expect(result()).toMatchObject({ projects: undefined, loading: false });

    enable();

    await expect.poll(() => result().projects).toEqual([blog, bank]);
  });

  it("reports a refused request (a user who is not an admin) and a network error as failed", async () => {
    const refused = setup({ mocks: [projectCatalogRefusedMock()] });
    refused.enable();
    await expect.poll(() => refused.result().failed).toBe(true);

    const offline = setup({ mocks: [projectCatalogNetworkErrorMock()] });
    offline.enable();
    await expect.poll(() => offline.result().failed).toBe(true);
    expect(offline.result().projects).toBeUndefined();
  });

  it("retry sends the failed request again", async () => {
    const { result, enable } = setup({
      mocks: [projectCatalogNetworkErrorMock(), projectCatalogMock()],
    });
    enable();
    await expect.poll(() => result().failed).toBe(true);

    result().retry();

    await expect.poll(() => result().projects).toEqual([blog, bank]);
  });
});

import { act } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  availableCvProjectsMock,
  availableCvProjectsNetworkErrorMock,
  availableCvProjectsRefusedMock,
  bank,
  blog,
  CV_ID,
} from "../cvProjects.mocks";
import {
  useAvailableCvProjects,
  type UseAvailableCvProjectsResult,
} from "./useAvailableCvProjects";

function setup(options: RenderWithProvidersOptions) {
  let current!: UseAvailableCvProjectsResult;
  let enable!: () => void;
  function Probe(): ReactNode {
    const [enabled, setEnabled] = useState(false);
    enable = () => setEnabled(true);
    current = useAvailableCvProjects(CV_ID, enabled);
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current, enable: () => act(() => enable()) };
}

describe("useAvailableCvProjects", () => {
  it("asks the backend only after it is enabled", async () => {
    // No other mock: a request before `enable` would fail the test with an unexpected-request error.
    const { result, enable } = setup({ mocks: [availableCvProjectsMock([blog, bank])] });
    expect(result()).toMatchObject({ options: undefined, loading: false });

    enable();

    await expect.poll(() => result().options).toEqual([blog, bank]);
  });

  it("reports a refused request (a CV the user may not use) and a network error as failed", async () => {
    const refused = setup({ mocks: [availableCvProjectsRefusedMock()] });
    refused.enable();
    await expect.poll(() => refused.result().failed).toBe(true);

    const offline = setup({ mocks: [availableCvProjectsNetworkErrorMock()] });
    offline.enable();
    await expect.poll(() => offline.result().failed).toBe(true);
    expect(offline.result().options).toBeUndefined();
  });

  it("retry sends the failed request again", async () => {
    const { result, enable } = setup({
      mocks: [availableCvProjectsNetworkErrorMock(), availableCvProjectsMock([blog, bank])],
    });
    enable();
    await expect.poll(() => result().failed).toBe(true);

    result().retry();

    await expect.poll(() => result().options).toEqual([blog, bank]);
  });
});

import { act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import { environmentOptionsErrorMock, environmentOptionsMock } from "../projects.mocks";
import { useEnvironmentOptions } from "./useEnvironmentOptions";

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions) {
  let current!: ReturnType<typeof useEnvironmentOptions>;
  function Probe(): ReactNode {
    current = useEnvironmentOptions();
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

describe("useEnvironmentOptions", () => {
  it("is loading first, then returns the skills as options in the order of the backend", async () => {
    const { result } = setup({ mocks: [environmentOptionsMock()] });

    expect(result().loading).toBe(true);
    await waitFor(() => expect(result().loading).toBe(false));

    expect(result().options).toEqual([
      { value: "16", label: "MobX" },
      { value: "13", label: "React" },
      { value: "12", label: "TypeScript" },
    ]);
    expect(result().failed).toBe(false);
  });

  it("reports a failed request and returns no options", async () => {
    const { result } = setup({ mocks: [environmentOptionsErrorMock()] });

    await waitFor(() => expect(result().failed).toBe(true));

    expect(result().options).toEqual([]);
  });

  it("loads the skills again on retry", async () => {
    const { result } = setup({ mocks: [environmentOptionsErrorMock(), environmentOptionsMock()] });
    await waitFor(() => expect(result().failed).toBe(true));

    act(() => result().retry());

    await waitFor(() => expect(result().failed).toBe(false));
    expect(result().options).toHaveLength(3);
  });
});

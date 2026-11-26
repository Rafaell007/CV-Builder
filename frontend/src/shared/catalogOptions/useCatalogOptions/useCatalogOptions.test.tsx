import { act } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  departmentOptions,
  departmentOptionsErrorMock,
  departmentOptionsMock,
  positionOptions,
  positionOptionsMock,
} from "../catalogOptions.mocks";
import type { UseCatalogOptionsResult } from "../catalogOptions.types";
import { useDepartmentOptions, usePositionOptions } from "./useCatalogOptions";

// The hook runs inside a small component; `setEnabled` stands for opening and closing the modal.
function setup(
  useOptions: (enabled: boolean) => UseCatalogOptionsResult,
  options: RenderWithProvidersOptions,
) {
  let current!: UseCatalogOptionsResult;
  let setEnabled!: (enabled: boolean) => void;
  function Probe(): ReactNode {
    const [enabled, setState] = useState(false);
    setEnabled = setState;
    current = useOptions(enabled);
    return null;
  }
  renderWithProviders(<Probe />, options);
  return {
    result: () => current,
    open: () => act(() => setEnabled(true)),
    close: () => act(() => setEnabled(false)),
  };
}

const names = (result: UseCatalogOptionsResult) => result.options?.map((option) => option.name);
const { dotNet, java, react } = departmentOptions;

describe("useDepartmentOptions", () => {
  it("sends nothing while closed, then loads the departments when opened", async () => {
    // No mock is used while closed: a request without a mock would fail the hook.
    const { result, open } = setup(useDepartmentOptions, { mocks: [departmentOptionsMock()] });
    expect(result()).toMatchObject({ options: undefined, loading: false, failed: false });

    open();
    expect(result().loading).toBe(true);

    await expect.poll(() => names(result())).toEqual([".NET", "Java", "React"]);
    expect(result()).toMatchObject({ loading: false, failed: false });
  });

  it("asks the server again each time it opens", async () => {
    const { result, open, close } = setup(useDepartmentOptions, {
      mocks: [departmentOptionsMock([dotNet]), departmentOptionsMock([dotNet, java])],
    });
    open();
    await expect.poll(() => names(result())).toEqual([".NET"]);

    close();
    expect(result()).toMatchObject({ options: undefined, loading: false });
    open();

    await expect.poll(() => names(result())).toEqual([".NET", "Java"]);
  });

  it("fails without options, and retry sends the request again", async () => {
    const { result, open } = setup(useDepartmentOptions, {
      mocks: [departmentOptionsErrorMock(), departmentOptionsMock([react])],
    });
    open();
    await expect.poll(() => result().failed).toBe(true);
    expect(result()).toMatchObject({ options: undefined, loading: false });

    act(() => result().retry());

    await expect.poll(() => names(result())).toEqual(["React"]);
    expect(result().failed).toBe(false);
  });
});

describe("usePositionOptions", () => {
  it("loads the positions when opened", async () => {
    const { result, open } = setup(usePositionOptions, { mocks: [positionOptionsMock()] });
    open();

    await expect
      .poll(() => names(result()))
      .toEqual(Object.values(positionOptions).map((position) => position.name));
  });
});

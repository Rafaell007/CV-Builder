import { act } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import { departmentOptionsErrorMock, departmentOptionsMock, departments } from "../users.mocks";
import type { UseCatalogOptionsResult } from "../useCatalogOptions";
import { useDepartmentOptions } from "./useDepartmentOptions";

// The hook runs inside a small component; `setEnabled` stands for opening and closing the modal.
function setup(options: RenderWithProvidersOptions) {
  let current!: UseCatalogOptionsResult;
  let setEnabled!: (enabled: boolean) => void;
  function Probe(): ReactNode {
    const [enabled, setState] = useState(false);
    setEnabled = setState;
    current = useDepartmentOptions(enabled);
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
const { react, dotNet, java } = departments;

describe("useDepartmentOptions", () => {
  it("sends nothing while closed, then loads the departments when opened", async () => {
    const { result, open } = setup({ mocks: [departmentOptionsMock([dotNet, java, react])] });
    expect(result()).toMatchObject({ options: undefined, loading: false, failed: false });

    open();
    expect(result().loading).toBe(true);

    await expect.poll(() => names(result())).toEqual([".NET", "Java", "React"]);
    expect(result().loading).toBe(false);
  });

  it("asks for the next pages until it has every department", async () => {
    const { result, open } = setup({
      mocks: [
        departmentOptionsMock([dotNet], { page: 1, total: 3 }),
        departmentOptionsMock([java], { page: 2, total: 3 }),
        departmentOptionsMock([react], { page: 3, total: 3 }),
      ],
    });
    open();

    await expect.poll(() => names(result())).toEqual([".NET", "Java", "React"]);
  });

  it("stops at an empty page, even when the total says more", async () => {
    // Departments deleted while the pages load: the total of page 1 is then too big.
    const { result, open } = setup({
      mocks: [
        departmentOptionsMock([dotNet], { page: 1, total: 3 }),
        departmentOptionsMock([], { page: 2, total: 1 }),
      ],
    });
    open();

    await expect.poll(() => names(result())).toEqual([".NET"]);
  });

  it("fails when any page fails, and retry loads every page again", async () => {
    const { result, open } = setup({
      mocks: [
        departmentOptionsMock([dotNet], { page: 1, total: 2 }),
        departmentOptionsErrorMock(2),
        departmentOptionsMock([dotNet], { page: 1, total: 2 }),
        departmentOptionsMock([java], { page: 2, total: 2 }),
      ],
    });
    open();
    await expect.poll(() => result().failed).toBe(true);
    expect(result()).toMatchObject({ options: undefined, loading: false });

    act(() => result().retry());
    expect(result()).toMatchObject({ loading: true, failed: false });

    await expect.poll(() => names(result())).toEqual([".NET", "Java"]);
  });

  it("loads again on each opening, so a new department shows up", async () => {
    const { result, open, close } = setup({
      mocks: [departmentOptionsMock([java]), departmentOptionsMock([java, react])],
    });
    open();
    await expect.poll(() => names(result())).toEqual(["Java"]);

    close();
    expect(result()).toMatchObject({ options: undefined, loading: false });
    open();
    // The old list is not shown while the new one loads.
    expect(result()).toMatchObject({ options: undefined, loading: true });

    await expect.poll(() => names(result())).toEqual(["Java", "React"]);
  });
});

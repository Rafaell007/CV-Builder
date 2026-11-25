import { act, screen } from "@testing-library/react";
import { Suspense, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import type { MockLink } from "@apollo/client/testing";
import { renderWithProviders } from "@/shared/testing";
import {
  departmentOptionsErrorMock,
  departmentOptionsMock,
  positionOptionsMock,
} from "../catalogOptions.mocks";
import type { UseCatalogOptionsResult } from "../catalogOptions.types";
import {
  useSuspenseDepartmentOptions,
  useSuspensePositionOptions,
} from "./useSuspenseCatalogOptions";

// On the page the route preloads the query on the server; here the mock answers it. The hook runs inside a small
// component in <Suspense>, which shows "Suspended" until the data is there.
async function setup(useOptions: () => UseCatalogOptionsResult, mocks: MockLink.MockedResponse[]) {
  let current: UseCatalogOptionsResult | undefined;
  function Probe(): ReactNode {
    current = useOptions();
    return <p>Loaded</p>;
  }
  // React 19 shows a suspended tree only inside an awaited act(); without it the fallback never leaves.
  await act(async () => {
    renderWithProviders(
      <Suspense fallback={<p>Suspended</p>}>
        <Probe />
      </Suspense>,
      { mocks },
    );
  });
  return { result: () => current };
}

const names = (result?: UseCatalogOptionsResult) => result?.options?.map((option) => option.name);

describe("useSuspenseDepartmentOptions", () => {
  it("suspends until the departments are there, then returns them", async () => {
    const { result } = await setup(useSuspenseDepartmentOptions, [departmentOptionsMock()]);

    expect(await screen.findByText("Loaded")).toBeInTheDocument();
    expect(names(result())).toEqual([".NET", "Java", "React"]);
    expect(result()).toMatchObject({ loading: false, failed: false });
  });

  it("returns a failure instead of throwing it, and retry sends the request again", async () => {
    const { result } = await setup(useSuspenseDepartmentOptions, [
      departmentOptionsErrorMock(),
      departmentOptionsMock(),
    ]);
    expect(await screen.findByText("Loaded")).toBeInTheDocument();
    expect(result()).toMatchObject({ options: undefined, loading: false, failed: true });

    await act(async () => {
      result()?.retry();
    });

    await expect.poll(() => names(result())).toEqual([".NET", "Java", "React"]);
    expect(result()?.failed).toBe(false);
  });
});

describe("useSuspensePositionOptions", () => {
  it("returns the positions", async () => {
    const { result } = await setup(useSuspensePositionOptions, [positionOptionsMock()]);

    expect(await screen.findByText("Loaded")).toBeInTheDocument();
    expect(names(result())).toEqual(["Data Analyst", "Project Manager", "Software Engineer"]);
  });
});

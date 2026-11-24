import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { positionOptionsMock, positions } from "../users.mocks";
import type { UseCatalogOptionsResult } from "../useCatalogOptions";
import { usePositionOptions } from "./usePositionOptions";

// The paging, failure and reopening rules are shared (`useCatalogOptions`) and tested in useDepartmentOptions.
describe("usePositionOptions", () => {
  it("loads every position when enabled", async () => {
    const { dataAnalyst, projectManager, softwareEngineer } = positions;
    let current!: UseCatalogOptionsResult;
    function Probe() {
      current = usePositionOptions(true);
      return null;
    }
    renderWithProviders(<Probe />, {
      mocks: [
        positionOptionsMock([dataAnalyst, projectManager], { page: 1, total: 3 }),
        positionOptionsMock([softwareEngineer], { page: 2, total: 3 }),
      ],
    });

    await expect
      .poll(() => current.options?.map((option) => option.name))
      .toEqual(["Data Analyst", "Project Manager", "Software Engineer"]);
  });
});

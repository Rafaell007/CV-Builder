import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { ResponsibilityTags } from "./ResponsibilityTags";

describe("ResponsibilityTags", () => {
  it("shows one tag for every item, in a list with the given name", () => {
    renderWithProviders(
      <ResponsibilityTags
        items={["Did something great", "Did not break production"]}
        label="Responsibilities"
      />,
    );

    const list = screen.getByRole("list", { name: "Responsibilities" });
    expect(
      within(list)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["Did something great", "Did not break production"]);
  });

  it("draws nothing for an empty list", () => {
    renderWithProviders(<ResponsibilityTags items={[]} label="Responsibilities" />);

    // The name matters: the toast viewport that the test providers render is also a list.
    expect(screen.queryByRole("list", { name: "Responsibilities" })).not.toBeInTheDocument();
  });
});

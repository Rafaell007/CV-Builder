import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { EnvironmentTags } from "./EnvironmentTags";

const items = [
  { id: "1", name: "TypeScript" },
  { id: "2", name: "React" },
];

describe("EnvironmentTags", () => {
  it("shows one tag for each technology, in a list with an accessible name", () => {
    renderWithProviders(<EnvironmentTags items={items} label="Environment" />);

    const list = screen.getByRole("list", { name: "Environment" });
    const tags = within(list).getAllByRole("listitem");
    expect(tags.map((tag) => tag.textContent)).toEqual(["TypeScript", "React"]);
  });

  it("shows nothing for a project without technologies", () => {
    renderWithProviders(<EnvironmentTags items={[]} label="Environment" />);

    // The name matters: the toast viewport that the test providers render is also a list.
    expect(screen.queryByRole("list", { name: "Environment" })).not.toBeInTheDocument();
  });
});

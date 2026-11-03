import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { Tabs } from "./Tabs";

const items = [
  { label: "Profile", href: "/users/1" },
  { label: "Skills", href: "/users/1/skills" },
  { label: "Languages", href: "/users/1/languages" },
];

describe("Tabs", () => {
  it("renders every tab as a link", () => {
    renderWithProviders(<Tabs items={items} pathname="/users/1" />);

    expect(screen.getByRole("link", { name: "Skills" })).toHaveAttribute("href", "/users/1/skills");
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });

  it("marks the tab of the current route", () => {
    renderWithProviders(<Tabs items={items} pathname="/users/1/languages" />);

    expect(screen.getByRole("link", { name: "Languages" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Profile" })).not.toHaveAttribute("aria-current");
  });

  it("marks only the most specific tab", () => {
    renderWithProviders(<Tabs items={items} pathname="/users/1/skills" />);

    expect(screen.getByRole("link", { name: "Skills" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Profile" })).not.toHaveAttribute("aria-current");
  });

  it("marks no tab when the route matches none", () => {
    renderWithProviders(<Tabs items={items} pathname="/cvs" />);

    screen.getAllByRole("link").forEach((link) => expect(link).not.toHaveAttribute("aria-current"));
  });
});

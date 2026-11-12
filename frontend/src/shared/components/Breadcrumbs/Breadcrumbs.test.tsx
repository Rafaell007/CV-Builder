import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { Breadcrumbs } from "./Breadcrumbs";

const items = [
  { label: "Users", href: "/users" },
  { label: "Jan Kowalski", href: "/users/1" },
  { label: "Skills" },
];

describe("Breadcrumbs", () => {
  it("renders the earlier items as links", () => {
    renderWithProviders(<Breadcrumbs items={items} label="Breadcrumbs" />);

    expect(screen.getByRole("link", { name: "Users" })).toHaveAttribute("href", "/en/users");
    expect(screen.getByRole("link", { name: "Jan Kowalski" })).toHaveAttribute(
      "href",
      "/en/users/1",
    );
  });

  it("renders the last item as the current page, not as a link", () => {
    renderWithProviders(<Breadcrumbs items={items} label="Breadcrumbs" />);

    expect(screen.queryByRole("link", { name: "Skills" })).not.toBeInTheDocument();
    expect(screen.getByText("Skills")).toHaveAttribute("aria-current", "page");
  });

  it("does not link the last item even when it has an href", () => {
    renderWithProviders(
      <Breadcrumbs items={[{ label: "Users", href: "/users" }]} label="Breadcrumbs" />,
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("puts a hidden chevron between items, not before the first", () => {
    renderWithProviders(<Breadcrumbs items={items} label="Breadcrumbs" />);

    const [first, second, third] = screen.getAllByRole("listitem");
    expect(first?.querySelector("svg")).toBeNull();
    expect(second?.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(third?.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("keeps the link name equal to the label when an item has an icon", () => {
    renderWithProviders(
      <Breadcrumbs
        label="Breadcrumbs"
        items={[
          { label: "Employees", href: "/users" },
          { label: "Jan Kowalski", href: "/users/1", highlighted: true, icon: <svg aria-hidden /> },
          { label: "Profile" },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "Jan Kowalski" })).toHaveAttribute(
      "href",
      "/en/users/1",
    );
  });

  it("uses the given navigation label", () => {
    renderWithProviders(<Breadcrumbs items={items} label="Okruszki" />);

    expect(screen.getByRole("navigation", { name: "Okruszki" })).toBeInTheDocument();
  });
});

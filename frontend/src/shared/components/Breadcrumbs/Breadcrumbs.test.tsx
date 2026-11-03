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
    renderWithProviders(<Breadcrumbs items={items} />);

    expect(screen.getByRole("link", { name: "Users" })).toHaveAttribute("href", "/en/users");
    expect(screen.getByRole("link", { name: "Jan Kowalski" })).toHaveAttribute(
      "href",
      "/en/users/1",
    );
  });

  it("renders the last item as the current page, not as a link", () => {
    renderWithProviders(<Breadcrumbs items={items} />);

    expect(screen.queryByRole("link", { name: "Skills" })).not.toBeInTheDocument();
    expect(screen.getByText("Skills")).toHaveAttribute("aria-current", "page");
  });

  it("does not link the last item even when it has an href", () => {
    renderWithProviders(<Breadcrumbs items={[{ label: "Users", href: "/users" }]} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("uses the given navigation label", () => {
    renderWithProviders(<Breadcrumbs items={items} label="Okruszki" />);

    expect(screen.getByRole("navigation", { name: "Okruszki" })).toBeInTheDocument();
  });
});

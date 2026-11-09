import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { PageHeader } from "./PageHeader";

const breadcrumbs = [{ label: "Employees", href: "/users" }, { label: "Profile" }];

describe("PageHeader", () => {
  it("gives the page a level 1 heading with the title", () => {
    renderWithProviders(
      <PageHeader title="Profile" breadcrumbs={breadcrumbs} breadcrumbsLabel="Breadcrumbs" />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Profile" })).toBeInTheDocument();
  });

  it("renders the breadcrumbs with the given label", () => {
    renderWithProviders(
      <PageHeader title="Profile" breadcrumbs={breadcrumbs} breadcrumbsLabel="Okruszki" />,
    );

    const navigation = screen.getByRole("navigation", { name: "Okruszki" });
    expect(navigation).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Employees" })).toHaveAttribute("href", "/en/users");
  });
});

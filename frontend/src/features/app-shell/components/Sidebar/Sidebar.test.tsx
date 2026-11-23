import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PeopleIcon, TrendingUpIcon, DomainIcon } from "@/shared/components/icons";
import { renderWithProviders } from "@/shared/testing";
import { Sidebar, type SidebarProps } from "./Sidebar";

const props: SidebarProps = {
  labels: { appName: "CV Builder", navigation: "Main navigation", toggle: "Sidebar" },
  mainLinks: [
    { href: "/users", label: "Employees", icon: PeopleIcon, active: true },
    { href: "/skills", label: "Skills", icon: TrendingUpIcon, active: false },
  ],
  extraLinks: [],
  collapsed: false,
  loading: false,
  onToggle: () => {},
  footer: null,
};

describe("Sidebar", () => {
  it("links the logo and app name to the home page", () => {
    renderWithProviders(<Sidebar {...props} />);

    expect(screen.getByRole("link", { name: "CV Builder" })).toHaveAttribute("href", "/en");
  });

  it("marks only the link of the current page", () => {
    renderWithProviders(<Sidebar {...props} />);

    expect(screen.getByRole("link", { name: "Employees" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Skills" })).not.toHaveAttribute("aria-current");
  });

  it("draws a divider before the extra links only when there are some", () => {
    const { rerender } = renderWithProviders(<Sidebar {...props} />);
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();

    rerender(
      <Sidebar
        {...props}
        extraLinks={[
          { href: "/admin/departments", label: "Departments", icon: DomainIcon, active: false },
        ]}
      />,
    );

    expect(screen.getByRole("separator")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Departments" })).toBeInTheDocument();
  });

  it("keeps the link names when collapsed, so a screen reader still hears them", () => {
    renderWithProviders(<Sidebar {...props} collapsed />);

    expect(screen.getByRole("link", { name: "Employees" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Skills" })).toBeInTheDocument();
  });

  it("draws bars instead of links while loading", () => {
    renderWithProviders(<Sidebar {...props} loading />);

    const navigation = screen.getByRole("navigation", { name: "Main navigation" });

    expect(within(navigation).queryByRole("link")).not.toBeInTheDocument();
    expect(navigation).toHaveAttribute("aria-busy", "true");
  });

  it("tells whether it is expanded and reports a click on the collapse button", async () => {
    const onToggle = vi.fn();
    const { user } = renderWithProviders(<Sidebar {...props} collapsed onToggle={onToggle} />);
    const toggle = screen.getByRole("button", { name: "Sidebar" });

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);

    expect(onToggle).toHaveBeenCalledOnce();
  });
});

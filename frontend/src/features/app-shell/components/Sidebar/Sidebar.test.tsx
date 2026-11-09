import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PeopleIcon, TrendingUpIcon, DomainIcon } from "@/shared/components/icons";
import { renderWithProviders } from "@/shared/testing";
import { Sidebar, type SidebarProps } from "./Sidebar";

const props: SidebarProps = {
  appName: "CV Builder",
  navigationLabel: "Main navigation",
  mainLinks: [
    { href: "/users", label: "Employees", icon: PeopleIcon, active: true },
    { href: "/skills", label: "Skills", icon: TrendingUpIcon, active: false },
  ],
  extraLinks: [],
  collapsed: false,
  toggleLabel: "Sidebar",
  onToggle: () => {},
};

describe("Sidebar", () => {
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

  it("tells whether it is expanded and reports a click on the collapse button", async () => {
    const onToggle = vi.fn();
    const { user } = renderWithProviders(<Sidebar {...props} collapsed onToggle={onToggle} />);
    const toggle = screen.getByRole("button", { name: "Sidebar" });

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);

    expect(onToggle).toHaveBeenCalledOnce();
  });
});

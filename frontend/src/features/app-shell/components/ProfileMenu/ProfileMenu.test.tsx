import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { ProfileMenu, type ProfileMenuProps } from "./ProfileMenu";

const props: ProfileMenuProps = {
  name: "Ann Lee",
  profileHref: "/users/7/profile",
  settingsHref: "/settings",
  labels: { profile: "Profile", settings: "Settings", logout: "Logout" },
  onLogout: () => {},
};

describe("ProfileMenu", () => {
  it("shows the first letter of the name as the avatar", () => {
    renderWithProviders(<ProfileMenu {...props} />);

    expect(screen.getByRole("button", { name: /Ann Lee/ })).toHaveTextContent("AAnn Lee");
  });

  it("links to the user's profile and to the settings", async () => {
    const { user } = renderWithProviders(<ProfileMenu {...props} />);

    await user.click(screen.getByRole("button", { name: /Ann Lee/ }));

    expect(screen.getByRole("menuitem", { name: "Profile" })).toHaveAttribute(
      "href",
      "/en/users/7/profile",
    );
    expect(screen.getByRole("menuitem", { name: "Settings" })).toHaveAttribute(
      "href",
      "/en/settings",
    );
  });

  it("logs out from the menu", async () => {
    const onLogout = vi.fn();
    const { user } = renderWithProviders(<ProfileMenu {...props} onLogout={onLogout} />);

    await user.click(screen.getByRole("button", { name: /Ann Lee/ }));
    await user.click(screen.getByRole("menuitem", { name: "Logout" }));

    expect(onLogout).toHaveBeenCalledOnce();
  });
});

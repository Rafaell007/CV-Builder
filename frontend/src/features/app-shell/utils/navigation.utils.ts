import type { Role } from "@/shared/graphql";
import { isPathActive } from "@/shared/utils";
import type { SidebarLink } from "../components/Sidebar";
import { ADMIN_EXTRA_NAV_ITEMS, ADMIN_NAV_ITEMS, USER_NAV_ITEMS } from "../navigation.constants";
import type { NavItem, NavItems, NavLabelKey } from "../navigation.types";

/** The sidebar links for a role: admins also get the extra management pages. */
export function getNavItems(role: Role): NavItems {
  if (role === "ADMIN") {
    return { mainItems: ADMIN_NAV_ITEMS, extraItems: ADMIN_EXTRA_NAV_ITEMS };
  }
  return { mainItems: USER_NAV_ITEMS, extraItems: [] };
}

/** Turns nav items into what the Sidebar draws: translated labels and the link of the current page marked. */
export function toSidebarLinks(
  items: ReadonlyArray<NavItem>,
  pathname: string,
  translate: (key: NavLabelKey) => string,
): SidebarLink[] {
  return items.map(({ href, labelKey, icon }) => ({
    href,
    label: translate(labelKey),
    icon,
    active: isPathActive(href, pathname),
  }));
}

/** "First Last", or the email while the user has not filled in a name (both are optional). */
export function getDisplayName(user: {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return name || user.email;
}

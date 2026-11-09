import type { Role } from "@/shared/graphql";

import { ADMIN_EXTRA_NAV_ITEMS, ADMIN_NAV_ITEMS, USER_NAV_ITEMS } from "../navigation.constants";
import type { NavItems } from "../navigation.types";

export function getNavItems(role: Role): NavItems {
  if (role === "ADMIN") {
    return { mainItems: ADMIN_NAV_ITEMS, extraItems: ADMIN_EXTRA_NAV_ITEMS };
  }
  return { mainItems: USER_NAV_ITEMS, extraItems: [] };
}

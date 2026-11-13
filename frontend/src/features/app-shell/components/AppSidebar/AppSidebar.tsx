"use client";

import { useTranslations } from "next-intl";
import { useCurrentUser } from "@/shared/currentUser";
import { usePathname } from "@/shared/i18n";
import { useSignOut } from "../../hooks";
import type { NavItems, NavLabelKey } from "../../navigation.types";
import { getDisplayName, getNavItems, toSidebarLinks } from "../../utils";
import { ProfileMenu } from "../ProfileMenu";
import { Sidebar } from "../Sidebar";

// Signed out: no links. While the user loads the Sidebar draws bars: the role decides where Skills and Languages point.
const NO_NAV_ITEMS: NavItems = { mainItems: [], extraItems: [] };

export interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

/** The Sidebar filled for the signed-in user: links by role, the current page marked, the profile menu. */
export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const t = useTranslations("appShell");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const { user, loading } = useCurrentUser();
  const { signOut } = useSignOut();

  const { mainItems, extraItems } = user ? getNavItems(user.role) : NO_NAV_ITEMS;
  const translate = (key: NavLabelKey) => t(`nav.${key}`);

  return (
    <Sidebar
      labels={{ appName: tCommon("appName"), navigation: t("navigation"), toggle: t("sidebar") }}
      mainLinks={toSidebarLinks(mainItems, pathname, translate)}
      extraLinks={toSidebarLinks(extraItems, pathname, translate)}
      collapsed={collapsed}
      loading={loading}
      onToggle={onToggle}
      footer={
        user && (
          <ProfileMenu
            name={getDisplayName(user)}
            profileHref={`/users/${user.id}/profile`}
            settingsHref="/settings"
            labels={{ profile: t("profile"), settings: t("settings"), logout: t("logout") }}
            onLogout={signOut}
          />
        )
      }
    />
  );
}

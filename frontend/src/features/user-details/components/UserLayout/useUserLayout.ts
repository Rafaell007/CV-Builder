"use client";

import { useTranslations } from "next-intl";
import type { BreadcrumbItem, TabItem } from "@/shared/components";
import { useCurrentUser } from "@/shared/currentUser";
import { usePathname } from "@/shared/i18n";
import { isPathActive } from "@/shared/utils";
import { USER_TABS } from "../../user-details.constants";
import type { UserTab } from "../../user-details.types";
import { getUserTabs, toUserTabPath } from "../../utils";

/**
 * The state of the User Details shell (the part that all tabs of a user share): the tabs this role may see,
 * and the breadcrumbs `Employees › {tab}`. The name of the user is not in the breadcrumbs: the Profile tab
 * (S6.2) owns the user query.
 */
export function useUserLayout(userId: string) {
  const t = useTranslations("userDetails");
  const common = useTranslations();
  const pathname = usePathname();
  const { isAdmin } = useCurrentUser();

  const toItem = (tab: UserTab): TabItem => ({
    label: t(`tabs.${tab}`),
    href: toUserTabPath(userId, tab),
  });
  const tabs = getUserTabs(isAdmin).map(toItem);
  // The title and the breadcrumbs follow the route, not the visible tabs: while the user loads, the CVs tab
  // is not drawn yet, and the header of /users/{id}/cvs must not flash another tab name.
  const activeTab =
    USER_TABS.map(toItem).find((tab) => isPathActive(tab.href, pathname)) ?? tabs[0]!;

  const breadcrumbs: BreadcrumbItem[] = [
    { label: common("appShell.nav.employees"), href: "/users" },
    { label: activeTab.label },
  ];

  return {
    tabs,
    pathname,
    breadcrumbs,
    title: activeTab.label,
    breadcrumbsLabel: common("common.breadcrumbs"),
    tabsLabel: t("tabs.label"),
  };
}

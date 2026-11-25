"use client";

import { useSuspenseQuery } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import type { BreadcrumbItem, TabItem } from "@/shared/components";
import { MeDocument, UserDocument } from "@/shared/graphql";
import { usePathname } from "@/shared/i18n";
import { getUserDisplayName, isPathActive } from "@/shared/utils";
import { USER_TABS } from "../../user-details.constants";
import type { UserTab } from "../../user-details.types";
import { getUserTabs, toUserTabPath } from "../../utils";

/**
 * The state of the User Details shell (the part that all tabs of a user share): the tabs this role may see, and the
 * breadcrumbs `Employees › {name} › {tab}`. Both queries are preloaded on the server by the route layout (PLAN D6),
 * so `useSuspenseQuery` reads them without a request of its own.
 */
export function useUserLayout(userId: string) {
  const t = useTranslations("userDetails");
  const common = useTranslations();
  const pathname = usePathname();
  const { data: meData } = useSuspenseQuery(MeDocument);
  const { data: userData } = useSuspenseQuery(UserDocument, { variables: { id: userId } });
  const isAdmin = meData.me?.role === "ADMIN";

  const toItem = (tab: UserTab): TabItem => ({
    label: t(`tabs.${tab}`),
    href: toUserTabPath(userId, tab),
  });
  const tabs = getUserTabs(isAdmin).map(toItem);
  // The title and the breadcrumbs follow the route, not the visible tabs, so /users/{id}/cvs always names its tab.
  const activeTab =
    USER_TABS.map(toItem).find((tab) => isPathActive(tab.href, pathname)) ?? tabs[0]!;

  const breadcrumbs: BreadcrumbItem[] = [
    { label: common("appShell.nav.employees"), href: "/users" },
    { label: getUserDisplayName(userData.user), highlighted: true },
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

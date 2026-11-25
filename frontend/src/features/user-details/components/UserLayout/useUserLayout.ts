"use client";

import { useSuspenseQuery } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import type { BreadcrumbItem, TabItem } from "@/shared/components";
import { MeDocument, UserDocument } from "@/shared/graphql";
import { usePathname } from "@/shared/i18n";
import { getUserDisplayName, isPathActive } from "@/shared/utils";
import { USER_TABS } from "../../user-details.constants";
import type { UserTab } from "../../user-details.types";
import { getUserTabs, toUserLayoutView, toUserTabPath } from "../../utils";

/**
 * The state of the User Details shell (the part that all tabs of a user share): what to show (the tab page, not
 * found or a failure with Retry), the tabs this role may see, and the breadcrumbs `Employees › {name} › {tab}`.
 * Both queries are preloaded on the server by the route layout (PLAN D6), so `useSuspenseQuery` reads them without a
 * request of its own. `errorPolicy: "all"` returns a failed `user` as `error` instead of throwing it: the shell picks
 * the screen, and the app shell stays. A failed `me` still throws to the full-screen error page: then the backend
 * cannot be reached at all.
 */
export function useUserLayout(userId: string) {
  const t = useTranslations("userDetails");
  const common = useTranslations();
  const pathname = usePathname();
  const { data: meData } = useSuspenseQuery(MeDocument);
  const {
    data: userData,
    error,
    refetch,
  } = useSuspenseQuery(UserDocument, { variables: { id: userId }, errorPolicy: "all" });
  const isAdmin = meData.me?.role === "ADMIN";
  const user = userData?.user;
  const view = toUserLayoutView(Boolean(user), error);

  const toItem = (tab: UserTab): TabItem => ({
    label: t(`tabs.${tab}`),
    href: toUserTabPath(userId, tab),
  });
  const tabs = getUserTabs(isAdmin).map(toItem);
  // The title and the breadcrumbs follow the route, not the visible tabs, so /users/{id}/cvs always names its tab.
  const activeTab =
    USER_TABS.map(toItem).find((tab) => isPathActive(tab.href, pathname)) ?? tabs[0]!;

  // The name only when the backend gave the user: nothing is shown that the backend did not return.
  const breadcrumbs: BreadcrumbItem[] = [
    { label: common("appShell.nav.employees"), href: "/users" },
    ...(user ? [{ label: getUserDisplayName(user), highlighted: true }] : []),
    { label: activeTab.label },
  ];

  return {
    view,
    tabs,
    pathname,
    breadcrumbs,
    title: activeTab.label,
    breadcrumbsLabel: common("common.breadcrumbs"),
    tabsLabel: t("tabs.label"),
    // `refetch` suspends again, so the route layout's skeleton shows while it runs. With `errorPolicy: "all"` a new
    // failure comes back as `error`, not as a rejected promise; the catch only stops an unhandled rejection.
    retry: () => void refetch().catch(() => undefined),
  };
}

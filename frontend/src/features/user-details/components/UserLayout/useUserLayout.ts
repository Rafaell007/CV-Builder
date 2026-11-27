"use client";

import { useSuspenseQuery } from "@apollo/client/react";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import type { BreadcrumbItem, TabItem } from "@/shared/components";
import { MeDocument, UserDocument } from "@/shared/graphql";
import { usePathname } from "@/shared/i18n";
import { getUserDisplayName, isPathActive } from "@/shared/utils";
import { USER_TABS } from "../../user-details.constants";
import type { UserTab } from "../../user-details.types";
import { getUserTabs, isUserNotFound, toUserTabPath } from "../../utils";

/**
 * The state of the User Details shell (the part that all tabs of a user share): the tabs this role may see, and the
 * breadcrumbs `Employees › {name} › {tab}`. Both queries are preloaded on the server by the route layout (PLAN D6),
 * so `useSuspenseQuery` reads them without a request of its own.
 * A failed load shows the full-screen pages of Figma, like any other page: an unknown user the 404 page
 * (`notFound()`), any other failure the "Oops" page with RETRY (`app/[locale]/error.tsx`). `errorPolicy: "all"` only
 * lets this hook tell the two apart: it returns the error instead of throwing it.
 */
export function useUserLayout(userId: string) {
  const t = useTranslations("userDetails");
  const common = useTranslations();
  const pathname = usePathname();
  const { data: meData } = useSuspenseQuery(MeDocument);
  const { data: userData, error } = useSuspenseQuery(UserDocument, {
    variables: { id: userId },
    errorPolicy: "all",
  });
  const user = userData?.user;
  if (!user) {
    if (isUserNotFound(error)) notFound();
    throw error ?? new Error("The user query returned no user");
  }
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
    { label: getUserDisplayName(user), highlighted: true },
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

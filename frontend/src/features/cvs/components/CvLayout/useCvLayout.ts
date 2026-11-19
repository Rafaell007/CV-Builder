"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { BreadcrumbItem, TabItem } from "@/shared/components";
import { usePathname } from "@/shared/i18n";
import { isPathActive } from "@/shared/utils";
import { CV_TABS } from "../../cvs.constants";
import { useCv } from "../../useCv";
import { toCvReturnPath, toCvTabPath } from "../../utils";

/** What the shell shows in place of the tab page: the page itself, a loading state or one of the failures. */
export type CvLayoutView = "ready" | "loading" | "notFound" | "forbidden" | "failed";

/**
 * The state of the CV shell (the part that all tabs of a CV share): loads the CV, decides what to show and
 * builds the tabs and the breadcrumbs `CVs › {CV name} › {tab}`. The tab page is shown only when the backend
 * returned the CV, so a direct link to another tab cannot get around the access check.
 * The name is left out of the breadcrumbs while the CV loads and after a failure: nothing is shown that the
 * backend did not give to this user.
 */
export function useCvLayout(cvId: string) {
  const t = useTranslations("cvs");
  const common = useTranslations();
  const pathname = usePathname();
  const { cv, loading, failure, retry } = useCv(cvId);

  // `from` is set when the CV was opened from the User CVs tab. It is checked, because the address is user input.
  const from = toCvReturnPath(useSearchParams()?.get("from"));

  const tabs: TabItem[] = CV_TABS.map((tab) => ({
    label: t(`tabs.${tab}`),
    href: toCvTabPath(cvId, tab, from),
  }));
  // The active tab is found with the plain routes: the query is not part of the pathname.
  const activeTab =
    CV_TABS.map((tab) => ({ label: t(`tabs.${tab}`), href: toCvTabPath(cvId, tab) })).find((tab) =>
      isPathActive(tab.href, pathname),
    ) ?? tabs[0]!;
  // The tabs keep `from`, so the Tabs must compare the route with the query too.
  const tabsPathname =
    from === undefined ? pathname : `${pathname}?${new URLSearchParams({ from })}`;

  // Data first: a refresh in the background must not replace a page that is already shown.
  const view: CvLayoutView = cv ? "ready" : loading || failure === undefined ? "loading" : failure;

  const breadcrumbs: BreadcrumbItem[] = [
    { label: common("appShell.nav.cvs"), href: from ?? "/cvs" },
    ...(cv ? [{ label: cv.name, highlighted: true }] : []),
    { label: activeTab.label },
  ];

  return {
    view,
    tabs,
    pathname: tabsPathname,
    breadcrumbs,
    title: activeTab.label,
    breadcrumbsLabel: common("common.breadcrumbs"),
    tabsLabel: t("tabs.label"),
    retry,
  };
}

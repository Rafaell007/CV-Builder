"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { BreadcrumbItem, TabItem } from "@/shared/components";
import { usePathname } from "@/shared/i18n";
import { isPathActive } from "@/shared/utils";
import { useCv } from "../../useCv";
import { toActiveTabHref, toCvReturnPath, toCvTabLinks } from "../../utils";

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

  // Built once: the links keep `from`; the plain paths find the active tab (the pathname has no query).
  const links = toCvTabLinks(cvId, from);
  const tabs: TabItem[] = links.map(({ tab, href }) => ({ label: t(`tabs.${tab}`), href }));
  const activeTab =
    tabs[
      Math.max(
        0,
        links.findIndex(({ path }) => isPathActive(path, pathname)),
      )
    ]!;
  // The tab links have `?from=...`, so the Tabs must get the current route with the same query.
  const activeTabHref = toActiveTabHref(pathname, from);

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
    pathname: activeTabHref,
    breadcrumbs,
    title: activeTab.label,
    breadcrumbsLabel: common("common.breadcrumbs"),
    tabsLabel: t("tabs.label"),
    retry,
  };
}

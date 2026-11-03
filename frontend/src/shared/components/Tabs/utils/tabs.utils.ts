/** True when `pathname` is the tab route or a route below it (/users/1 is inside /users/1/skills). */
export function isTabActive(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Index of the tab that matches `pathname`, or -1. The longest matching href wins,
 * so a tab at /users/1 does not stay active on /users/1/skills when that has its own tab.
 */
export function getActiveTabIndex(hrefs: ReadonlyArray<string>, pathname: string): number {
  let activeIndex = -1;
  let activeLength = -1;
  hrefs.forEach((href, index) => {
    if (!isTabActive(href, pathname) || href.length <= activeLength) return;
    activeIndex = index;
    activeLength = href.length;
  });
  return activeIndex;
}

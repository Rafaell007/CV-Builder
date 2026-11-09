/** True when `pathname` is `href` or a route below it (/users/1/skills is inside /users/1). */
export function isPathActive(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

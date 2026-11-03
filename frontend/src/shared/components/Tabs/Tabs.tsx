import Link from "next/link";
import { getActiveTabIndex } from "./utils";
import styles from "./Tabs.module.css";

export interface TabItem {
  label: string;
  href: string;
}

export interface TabsProps {
  items: ReadonlyArray<TabItem>;
  /** Current route, from `usePathname()` in the layout. The tab that matches it is active. */
  pathname: string;
  /** Accessible name of the navigation landmark. Callers pass a translated text. */
  label?: string;
}

/** Route-driven tabs: every tab is a link, so the URL keeps the active tab after a refresh. */
export function Tabs({ items, pathname, label = "Tabs" }: TabsProps) {
  const activeIndex = getActiveTabIndex(
    items.map((item) => item.href),
    pathname,
  );

  return (
    <nav aria-label={label}>
      <ul className={styles.list}>
        {items.map((item, index) => (
          <li key={item.href}>
            <Link
              className={styles.tab}
              href={item.href}
              aria-current={index === activeIndex ? "page" : undefined}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

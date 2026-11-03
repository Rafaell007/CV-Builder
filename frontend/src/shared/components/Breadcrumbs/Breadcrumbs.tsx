import Link from "next/link";
import styles from "./Breadcrumbs.module.css";

export interface BreadcrumbItem {
  label: string;
  /** Link target. The last item is the current page and is never a link. */
  href?: string;
}

export interface BreadcrumbsProps {
  items: ReadonlyArray<BreadcrumbItem>;
  /** Accessible name of the navigation landmark. Callers pass a translated text. */
  label?: string;
}

/** Trail of links to the current page, for example Users › Jan Kowalski. */
export function Breadcrumbs({ items, label = "Breadcrumbs" }: BreadcrumbsProps) {
  return (
    <nav aria-label={label}>
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;
          return (
            <li key={`${index}-${item.label}`} className={styles.item}>
              {isCurrent || !item.href ? (
                <span className={styles.current} aria-current={isCurrent ? "page" : undefined}>
                  {item.label}
                </span>
              ) : (
                <Link className={styles.link} href={item.href}>
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

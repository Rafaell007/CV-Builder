import type { ReactNode } from "react";
import { Link } from "@/shared/i18n";
import { ChevronRightIcon } from "../icons";
import styles from "./Breadcrumbs.module.css";

export interface BreadcrumbItem {
  label: string;
  /** Link target. The last item is the current page and is never a link. */
  href?: string;
  /** Shows the item in red, for example the user in Employees › User › Profile. */
  highlighted?: boolean;
  /** Decorative icon before the label (24×24). */
  icon?: ReactNode;
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
          const className = item.highlighted
            ? `${styles.entry} ${styles.highlighted}`
            : styles.entry;
          const content = (
            <>
              {item.icon && <span className={styles.icon}>{item.icon}</span>}
              {item.label}
            </>
          );

          return (
            <li key={`${index}-${item.label}`} className={styles.item}>
              {index > 0 && (
                <ChevronRightIcon className={styles.separator} width={20} height={20} />
              )}
              {isCurrent || !item.href ? (
                <span className={className} aria-current={isCurrent ? "page" : undefined}>
                  {content}
                </span>
              ) : (
                <Link className={`${className} ${styles.link}`} href={item.href}>
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

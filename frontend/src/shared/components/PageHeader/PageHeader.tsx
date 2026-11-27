import { Breadcrumbs, type BreadcrumbItem } from "../Breadcrumbs";
import styles from "./PageHeader.module.css";

export interface PageHeaderProps {
  /** Page name for screen readers; Figma shows no visible title, the breadcrumbs name the page. */
  title: string;
  breadcrumbs: ReadonlyArray<BreadcrumbItem>;
  /** Accessible name of the breadcrumbs navigation. Callers pass a translated text. */
  breadcrumbsLabel: string;
}

/** Sticky bar at the top of every signed-in page: the breadcrumbs and a hidden page heading. */
export function PageHeader({ title, breadcrumbs, breadcrumbsLabel }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <h1 className={styles.visuallyHidden}>{title}</h1>
      <Breadcrumbs items={breadcrumbs} label={breadcrumbsLabel} />
    </header>
  );
}

import type { ComponentType, ReactNode } from "react";
import { ChevronLeftIcon, type IconProps } from "@/shared/components/icons";
import { Link } from "@/shared/i18n";
import styles from "./Sidebar.module.css";

export type SidebarLink = {
  href: string;
  label: string;
  icon: ComponentType<IconProps>;
  active: boolean;
};

export interface SidebarProps {
  appName: string;
  /** Accessible name of the navigation landmark. */
  navigationLabel: string;
  mainLinks: ReadonlyArray<SidebarLink>;
  /** Admin pages, drawn below a divider. Empty for a user. */
  extraLinks: ReadonlyArray<SidebarLink>;
  collapsed: boolean;
  /** Accessible name of the collapse button; `aria-expanded` gives its state. */
  toggleLabel: string;
  onToggle: () => void;
  /** The profile row at the bottom. */
  footer?: ReactNode;
}

const NAVIGATION_ID = "app-sidebar-navigation";

/**
 * App navigation: logo, links, the collapse button and the profile row. Its width comes from
 * `--sidebar-width` (AppShell); when collapsed, the labels are clipped but stay the links' accessible names.
 */
export function Sidebar({
  appName,
  navigationLabel,
  mainLinks,
  extraLinks,
  collapsed,
  toggleLabel,
  onToggle,
  footer,
}: SidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoRow}>
        <span className={styles.appName}>{appName}</span>
      </div>
      <button
        type="button"
        className={styles.toggle}
        aria-label={toggleLabel}
        aria-expanded={!collapsed}
        aria-controls={NAVIGATION_ID}
        onClick={onToggle}
      >
        <ChevronLeftIcon className={styles.chevron} aria-hidden="true" />
      </button>
      <nav id={NAVIGATION_ID} className={styles.navigation} aria-label={navigationLabel}>
        <SidebarLinkList links={mainLinks} />
        {extraLinks.length > 0 && (
          <>
            <hr className={styles.divider} />
            <SidebarLinkList links={extraLinks} />
          </>
        )}
      </nav>
      {footer && <div className={styles.footer}>{footer}</div>}
    </aside>
  );
}

function SidebarLinkList({ links }: { links: ReadonlyArray<SidebarLink> }) {
  return (
    <ul className={styles.list}>
      {links.map(({ href, label, icon: Icon, active }) => (
        <li key={href}>
          <Link
            href={href}
            className={`${styles.link} ${active ? styles.active : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <Icon className={styles.icon} aria-hidden="true" />
            <span className={styles.label}>{label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

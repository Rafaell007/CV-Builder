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

export interface SidebarLabels {
  appName: string;
  /** Accessible name of the navigation landmark. */
  navigation: string;
  /** Accessible name of the collapse button; `aria-expanded` gives its state. */
  toggle: string;
}

export interface SidebarProps {
  labels: SidebarLabels;
  mainLinks: ReadonlyArray<SidebarLink>;
  /** Admin pages, drawn below a divider. Empty for a user. */
  extraLinks: ReadonlyArray<SidebarLink>;
  collapsed: boolean;
  /** The links are not known yet (the user is loading): grey bars take their place. */
  loading: boolean;
  onToggle: () => void;
  /** The profile row at the bottom; nothing while the user loads. */
  footer: ReactNode;
}

const NAVIGATION_ID = "app-sidebar-navigation";

/**
 * App navigation: logo, links, the collapse button and the profile row. Its width comes from
 * `--sidebar-width` (AppShell); when collapsed, the labels are clipped but stay the links' accessible names.
 */
export function Sidebar({
  labels,
  mainLinks,
  extraLinks,
  collapsed,
  loading,
  onToggle,
  footer,
}: SidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoRow}>
        <span className={styles.appName}>{labels.appName}</span>
      </div>
      <button
        type="button"
        className={styles.toggle}
        aria-label={labels.toggle}
        aria-expanded={!collapsed}
        aria-controls={NAVIGATION_ID}
        onClick={onToggle}
      >
        <ChevronLeftIcon className={styles.chevron} aria-hidden="true" />
      </button>
      <nav
        id={NAVIGATION_ID}
        className={styles.navigation}
        aria-label={labels.navigation}
        aria-busy={loading}
      >
        {loading ? (
          <SidebarSkeleton />
        ) : (
          <>
            <SidebarLinkList links={mainLinks} />
            {extraLinks.length > 0 && (
              <>
                <hr className={styles.divider} />
                <SidebarLinkList links={extraLinks} />
              </>
            )}
          </>
        )}
      </nav>
      {footer && <div className={styles.footer}>{footer}</div>}
    </aside>
  );
}

// A user has 4 links, so 4 bars: the admin links appear below them once the role is known.
const SKELETON_BARS = [0, 1, 2, 3];

function SidebarSkeleton() {
  return (
    <ul className={styles.list} aria-hidden="true">
      {SKELETON_BARS.map((bar) => (
        <li key={bar} className={styles.skeletonBar} />
      ))}
    </ul>
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

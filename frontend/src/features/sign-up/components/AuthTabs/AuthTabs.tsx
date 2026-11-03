import Link from "next/link";
import styles from "./AuthTabs.module.css";

export type AuthTabsProps = {
  active: "sign-in" | "sign-up";
};

// Links, not a Radix tablist: each tab is its own page, so the browser history and the address bar stay correct.
export function AuthTabs({ active }: AuthTabsProps) {
  return (
    <nav aria-label="Authentication" className={styles.tabs}>
      <Link
        href="/sign-in"
        className={styles.tab}
        aria-current={active === "sign-in" ? "page" : undefined}
      >
        SIGN IN
      </Link>
      <Link
        href="/sign-up"
        className={styles.tab}
        aria-current={active === "sign-up" ? "page" : undefined}
      >
        SIGN UP
      </Link>
    </nav>
  );
}

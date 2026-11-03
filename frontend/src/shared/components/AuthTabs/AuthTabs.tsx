import { Link } from "@/shared/i18n";
import styles from "./AuthTabs.module.css";

export type AuthTabsProps = {
  active: "sign-in" | "sign-up";
  // Translated by the caller, so the sign-in page can reuse the tabs with its own messages.
  label: string;
  signInLabel: string;
  signUpLabel: string;
};

// Links, not a Radix tablist: each tab is its own page, so the browser history and the address bar stay correct.
export function AuthTabs({ active, label, signInLabel, signUpLabel }: AuthTabsProps) {
  return (
    <nav aria-label={label} className={styles.tabs}>
      <Link
        href="/sign-in"
        className={styles.tab}
        aria-current={active === "sign-in" ? "page" : undefined}
      >
        {signInLabel}
      </Link>
      <Link
        href="/sign-up"
        className={styles.tab}
        aria-current={active === "sign-up" ? "page" : undefined}
      >
        {signUpLabel}
      </Link>
    </nav>
  );
}

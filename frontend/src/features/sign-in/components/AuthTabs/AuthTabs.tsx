import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n";
import styles from "./AuthTabs.module.css";

export type AuthTabsProps = {
  active: "sign-in" | "sign-up";
};

// Two links, not ARIA tabs: each one opens its own page, and aria-current marks the page we are on.
export function AuthTabs({ active }: AuthTabsProps) {
  const t = useTranslations("signIn.tabs");

  return (
    <nav className={styles.tabs} aria-label={t("label")}>
      <Link
        href="/sign-in"
        className={styles.tab}
        aria-current={active === "sign-in" ? "page" : undefined}
      >
        {t("signIn")}
      </Link>
      <Link
        href="/sign-up"
        className={styles.tab}
        aria-current={active === "sign-up" ? "page" : undefined}
      >
        {t("signUp")}
      </Link>
    </nav>
  );
}

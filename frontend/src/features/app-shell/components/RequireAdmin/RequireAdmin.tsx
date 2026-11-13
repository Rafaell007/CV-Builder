"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useCurrentUser } from "@/shared/currentUser";
import { ErrorScreen, PageState } from "@/shared/components";
import { Link } from "@/shared/i18n";
import styles from "./RequireAdmin.module.css";

/**
 * Route guard for the Admin pages. While the user loads it shows a loading state, so the page (and its
 * requests) do not start. A user who is not an Admin sees a Forbidden screen with a link back.
 * This is only a clear message: the backend still rejects every Admin request of other users (PLAN D10).
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const t = useTranslations("appShell.forbidden");
  const { loading, isAdmin } = useCurrentUser();

  if (loading) {
    return <PageState kind="loading" />;
  }

  if (!isAdmin) {
    return (
      <ErrorScreen title={t("title")} message={t("message")} announce>
        <Link href="/users" className={styles.link}>
          {t("back")}
        </Link>
      </ErrorScreen>
    );
  }

  return children;
}

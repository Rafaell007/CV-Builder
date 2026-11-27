"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { ErrorScreen, PageHeader, PageState, Tabs } from "@/shared/components";
import { Link } from "@/shared/i18n";
import { useCvLayout } from "./useCvLayout";
import styles from "./CvLayout.module.css";

export interface CvLayoutProps {
  cvId: string;
  /** The page of the open tab. It is shown only after the backend returned the CV. */
  children: ReactNode;
}

/**
 * The shell that every tab of a CV shares: the breadcrumbs, the four tabs and the states of loading the CV
 * (loading, failed with Retry, not found, no access). The backend decides who may open the CV.
 */
export function CvLayout({ cvId, children }: CvLayoutProps) {
  const t = useTranslations("cvs.details");
  const { view, tabs, pathname, breadcrumbs, title, breadcrumbsLabel, tabsLabel, retry } =
    useCvLayout(cvId);

  function renderBody() {
    switch (view) {
      case "ready":
        return children;
      case "loading":
        return <PageState kind="loading" labels={{ loading: t("states.loading") }} />;
      case "failed":
        return (
          <PageState
            kind="error"
            onRetry={retry}
            labels={{ error: t("states.error"), retry: t("states.retry") }}
          />
        );
      case "notFound":
      case "forbidden":
        return (
          <ErrorScreen title={t(`${view}.title`)} message={t(`${view}.message`)} announce>
            <Link href="/cvs" className={styles.link}>
              {t(`${view}.back`)}
            </Link>
          </ErrorScreen>
        );
    }
  }

  // The tabs lead to pages of this CV, so they are hidden when there is no CV to open.
  const showTabs = view === "ready" || view === "loading";

  return (
    <>
      <PageHeader title={title} breadcrumbs={breadcrumbs} breadcrumbsLabel={breadcrumbsLabel} />
      <div className={styles.page}>
        {showTabs && <Tabs items={tabs} pathname={pathname} label={tabsLabel} />}
        <div className={styles.content}>{renderBody()}</div>
      </div>
    </>
  );
}

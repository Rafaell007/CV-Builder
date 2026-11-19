"use client";

import type { ReactNode } from "react";
import { PageHeader, Tabs } from "@/shared/components";
import { useUserLayout } from "./useUserLayout";
import styles from "./UserLayout.module.css";

export interface UserLayoutProps {
  userId: string;
  /** The page of the open tab. */
  children: ReactNode;
}

/** The shell that every tab of a user shares: the breadcrumbs and the tabs. The CVs tab is shown to an Admin only. */
export function UserLayout({ userId, children }: UserLayoutProps) {
  const { tabs, pathname, breadcrumbs, title, breadcrumbsLabel, tabsLabel } = useUserLayout(userId);

  return (
    <>
      <PageHeader title={title} breadcrumbs={breadcrumbs} breadcrumbsLabel={breadcrumbsLabel} />
      <div className={styles.page}>
        <Tabs items={tabs} pathname={pathname} label={tabsLabel} />
        <div className={styles.content}>{children}</div>
      </div>
    </>
  );
}

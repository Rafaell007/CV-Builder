"use client";

import { Suspense, type ReactNode } from "react";
import { useSidebarCollapsed } from "../../hooks";
import { AppSidebar } from "../AppSidebar";
import styles from "./AppShell.module.css";

/** Layout of the signed-in pages: the sidebar by role and the page next to it. */
export function AppShell({ children }: { children: ReactNode }) {
  const { collapsed, userChoice, toggle } = useSidebarCollapsed();

  return (
    // No attribute until the user clicks: CSS picks the width from the screen, also before hydration.
    <div className={styles.shell} data-collapsed={userChoice ?? undefined}>
      {/* The current path is known only per request on dynamic routes, so the sidebar streams in. The empty
          fallback holds the sidebar column of the grid, so the page does not move when the sidebar arrives. */}
      <Suspense fallback={<div />}>
        <AppSidebar collapsed={collapsed} onToggle={toggle} />
      </Suspense>
      <main className={styles.main}>{children}</main>
    </div>
  );
}

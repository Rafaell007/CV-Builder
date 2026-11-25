import { Suspense } from "react";
import { AppShell } from "@/features/app-shell";
import { PageState } from "@/shared/components/PageState";

// Protected routes: the sidebar by role and the page next to it. The proxy checks the session first (PLAN D9).
// One <Suspense> around every page: a page that renders per request (PLAN D6, `PrefetchQuery`) waits inside it. On a
// full load the server streams the page into it. On a client navigation React keeps the old page until the new one
// is ready (about 50 ms measured, KAN-172); a boundary inside the page would show its loading state first, and React
// keeps a loading state for at least 300 ms. Static pages are not affected.
export default function AppLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <AppShell>
      <Suspense fallback={<PageState kind="loading" />}>{children}</Suspense>
    </AppShell>
  );
}

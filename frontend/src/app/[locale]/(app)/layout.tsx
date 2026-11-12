import { AppShell } from "@/features/app-shell";

// Protected routes: the sidebar by role and the page next to it. Session check and role guards are added in S0.10.
export default function AppLayout({ children }: LayoutProps<"/[locale]">) {
  return <AppShell>{children}</AppShell>;
}

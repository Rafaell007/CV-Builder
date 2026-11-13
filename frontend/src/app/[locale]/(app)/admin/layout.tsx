import { RequireAdmin } from "@/features/app-shell";

// Every route under /admin is for Admin users: a non-admin sees a Forbidden screen, not a backend error.
export default function AdminLayout({ children }: LayoutProps<"/[locale]/admin">) {
  return <RequireAdmin>{children}</RequireAdmin>;
}

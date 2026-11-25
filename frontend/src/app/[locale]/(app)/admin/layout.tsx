import { RequireAdmin } from "@/features/app-shell";
import { PrefetchQuery } from "@/shared/apollo/server";
import { MeDocument } from "@/shared/graphql";

// Every route under /admin is for Admin users: a non-admin sees a Forbidden screen, not a backend error.
// The current user is prefetched on the server (PLAN D6), inside the <Suspense> of the (app) layout, so RequireAdmin
// decides in the server HTML already.
export default function AdminLayout({ children }: LayoutProps<"/[locale]/admin">) {
  return (
    <PrefetchQuery query={MeDocument}>
      <RequireAdmin>{children}</RequireAdmin>
    </PrefetchQuery>
  );
}

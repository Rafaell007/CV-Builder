import { Suspense } from "react";
import { RequireAdmin } from "@/features/app-shell";
import { PrefetchQuery } from "@/shared/apollo/server";
import { PageState } from "@/shared/components/PageState";
import { MeDocument } from "@/shared/graphql";

// Every route under /admin is for Admin users: a non-admin sees a Forbidden screen, not a backend error.
// The current user is prefetched on the server (PLAN D6), so RequireAdmin decides in the server HTML already.
export default function AdminLayout({ children }: LayoutProps<"/[locale]/admin">) {
  return (
    <Suspense fallback={<PageState kind="loading" />}>
      <PrefetchQuery query={MeDocument}>
        <RequireAdmin>{children}</RequireAdmin>
      </PrefetchQuery>
    </Suspense>
  );
}

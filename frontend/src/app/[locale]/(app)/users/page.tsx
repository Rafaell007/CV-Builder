import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { Users, USERS_FIRST_PAGE } from "@/features/users";
import { PrefetchQuery } from "@/shared/apollo/server";
import { PageHeader } from "@/shared/components/PageHeader";
import { PageState } from "@/shared/components/PageState";
import { MeDocument, UsersDocument } from "@/shared/graphql";

export default function UsersPage() {
  const t = useTranslations();
  const title = t("common.employees");

  return (
    <>
      <PageHeader
        title={title}
        breadcrumbs={[{ label: title }]}
        breadcrumbsLabel={t("common.breadcrumbs")}
      />
      {/* Rendered on the server per request (PLAN D6): the user (the role decides CREATE USER and the row actions)
          and the first page are in the Apollo cache before the list renders. */}
      <Suspense
        fallback={<PageState kind="loading" labels={{ loading: t("users.states.loading") }} />}
      >
        <PrefetchQuery query={MeDocument}>
          <PrefetchQuery query={UsersDocument} variables={USERS_FIRST_PAGE}>
            <Users />
          </PrefetchQuery>
        </PrefetchQuery>
      </Suspense>
    </>
  );
}

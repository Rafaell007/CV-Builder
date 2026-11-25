import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { Cvs, CVS_FIRST_PAGE } from "@/features/cvs";
import { PrefetchQuery } from "@/shared/apollo/server";
import { PageHeader } from "@/shared/components/PageHeader";
import { PageState } from "@/shared/components/PageState";
import { CvsDocument, MeDocument } from "@/shared/graphql";

export default function CvsPage() {
  const t = useTranslations();
  const title = t("appShell.nav.cvs");

  return (
    <>
      <PageHeader
        title={title}
        breadcrumbs={[{ label: title }]}
        breadcrumbsLabel={t("common.breadcrumbs")}
      />
      {/* Rendered on the server per request (PLAN D6): the user (the role picks the empty text) and the first page
          are in the Apollo cache before the list renders. */}
      <Suspense
        fallback={<PageState kind="loading" labels={{ loading: t("cvs.states.loading") }} />}
      >
        <PrefetchQuery query={MeDocument}>
          <PrefetchQuery query={CvsDocument} variables={CVS_FIRST_PAGE}>
            <Cvs />
          </PrefetchQuery>
        </PrefetchQuery>
      </Suspense>
    </>
  );
}

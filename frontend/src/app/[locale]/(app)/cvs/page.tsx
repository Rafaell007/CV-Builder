import { useTranslations } from "next-intl";
import { Cvs, CVS_FIRST_PAGE } from "@/features/cvs";
import { PrefetchQuery } from "@/shared/apollo/server";
import { PageHeader } from "@/shared/components/PageHeader";
import { CvsDocument, MeDocument } from "@/shared/graphql";

// A navigation to this page waits for its data (about 50 ms) and keeps the old page meanwhile, instead of showing a
// loading state that React keeps for at least 300 ms (see the (app) layout).
// https://nextjs.org/docs/messages/blocking-prerender-dynamic
export const instant = false;

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
      {/* Rendered on the server per request (PLAN D6), inside the <Suspense> of the (app) layout: the user (the role
          picks the empty text) and the first page are in the Apollo cache before the list renders. */}
      <PrefetchQuery query={MeDocument}>
        <PrefetchQuery query={CvsDocument} variables={CVS_FIRST_PAGE}>
          <Cvs />
        </PrefetchQuery>
      </PrefetchQuery>
    </>
  );
}

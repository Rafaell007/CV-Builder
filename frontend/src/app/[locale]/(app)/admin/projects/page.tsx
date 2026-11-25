import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { Projects, PROJECTS_FIRST_PAGE } from "@/features/projects";
import { PrefetchQuery } from "@/shared/apollo/server";
import { PageHeader } from "@/shared/components/PageHeader";
import { PageState } from "@/shared/components/PageState";
import { ProjectsDocument } from "@/shared/graphql";

// The admin layout waits for the current user on the server before RequireAdmin renders this page, so the page is not
// rendered during prerender and Next.js cannot check it for instant navigation. That is intended: only an Admin may
// see it. https://nextjs.org/docs/messages/instant-unrendered-segment
export const instant = false;

export default function AdminProjectsPage() {
  const t = useTranslations();
  const title = t("appShell.nav.projects");

  return (
    <>
      <PageHeader
        title={title}
        breadcrumbs={[{ label: title }]}
        breadcrumbsLabel={t("common.breadcrumbs")}
      />
      {/* The first page is rendered on the server per request (PLAN D6). The backend refuses it to a non-admin. */}
      <Suspense
        fallback={<PageState kind="loading" labels={{ loading: t("projects.states.loading") }} />}
      >
        <PrefetchQuery query={ProjectsDocument} variables={PROJECTS_FIRST_PAGE}>
          <Projects />
        </PrefetchQuery>
      </Suspense>
    </>
  );
}

import { useTranslations } from "next-intl";
import { PageHeader, PageState } from "@/shared/components";
import styles from "./UserLayout.module.css";

/**
 * What the User Details shell shows while its data loads (the `<Suspense>` fallback of the route layout): the
 * breadcrumbs `Employees › Loading employee` and a loading skeleton. The loading text is the last breadcrumb, because
 * the last one is the current page, and that is not Employees. No tabs: they depend on the role, not known yet.
 */
export function UserLayoutSkeleton() {
  const t = useTranslations("userDetails");
  const common = useTranslations();
  const loading = t("states.loading");

  return (
    <>
      <PageHeader
        title={loading}
        breadcrumbs={[
          { label: common("appShell.nav.employees"), href: "/users" },
          { label: loading },
        ]}
        breadcrumbsLabel={common("common.breadcrumbs")}
      />
      <div className={styles.page}>
        <div className={styles.content}>
          <PageState kind="loading" labels={{ loading }} />
        </div>
      </div>
    </>
  );
}

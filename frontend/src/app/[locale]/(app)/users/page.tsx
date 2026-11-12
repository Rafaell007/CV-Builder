import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { HealthCheck } from "@/features/health";
import { PageHeader } from "@/shared/components/PageHeader";

// Placeholder (PLAN §6); the real page comes with its own step. HealthCheck is the Apollo demo (KAN-68).
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
      <Suspense fallback={<p>{t("health.checking")}</p>}>
        <HealthCheck />
      </Suspense>
    </>
  );
}

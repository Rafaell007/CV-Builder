import { useTranslations } from "next-intl";
import { PageHeader } from "@/shared/components/PageHeader";

// Placeholder (PLAN §6); the real page comes with its own step.
export default function CvDetailsPage() {
  const t = useTranslations();
  const title = t("common.details");

  return (
    <PageHeader
      title={title}
      breadcrumbs={[{ label: t("appShell.nav.cvs"), href: "/cvs" }, { label: title }]}
      breadcrumbsLabel={t("common.breadcrumbs")}
    />
  );
}

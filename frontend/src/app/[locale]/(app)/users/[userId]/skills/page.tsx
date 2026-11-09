import { useTranslations } from "next-intl";
import { PageHeader } from "@/shared/components/PageHeader";

// Placeholder (PLAN §6); the real page comes with its own step.
export default function UserSkillsPage() {
  const t = useTranslations();
  const title = t("appShell.nav.skills");

  return (
    <PageHeader
      title={title}
      breadcrumbs={[{ label: t("appShell.nav.employees"), href: "/users" }, { label: title }]}
      breadcrumbsLabel={t("common.breadcrumbs")}
    />
  );
}

import { useTranslations } from "next-intl";
import { PageHeader } from "@/shared/components/PageHeader";

// Placeholder (PLAN §6); the real page comes with its own step.
export default function UserProfilePage() {
  const t = useTranslations();
  const title = t("appShell.profile");

  return (
    <PageHeader
      title={title}
      breadcrumbs={[{ label: t("appShell.nav.employees"), href: "/users" }, { label: title }]}
      breadcrumbsLabel={t("common.breadcrumbs")}
    />
  );
}

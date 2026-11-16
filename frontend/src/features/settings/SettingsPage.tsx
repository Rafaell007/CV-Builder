import { useTranslations } from "next-intl";
import { PageHeader } from "@/shared/components/PageHeader";

// Scaffold (KAN-94 step 6): only the header so far. The preferences and the password form come in steps 7–9.
export function SettingsPage() {
  const t = useTranslations();
  const title = t("settings.title");

  return (
    <PageHeader
      title={title}
      breadcrumbs={[{ label: title }]}
      breadcrumbsLabel={t("common.breadcrumbs")}
    />
  );
}

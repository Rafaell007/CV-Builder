import { useTranslations } from "next-intl";
import { PageHeader } from "@/shared/components/PageHeader";
import { PreferencesFields } from "./components/PreferencesFields";

// The password form and the layout come in steps 8–9.
export function SettingsPage() {
  const t = useTranslations();
  const title = t("settings.title");

  return (
    <>
      <PageHeader
        title={title}
        breadcrumbs={[{ label: title }]}
        breadcrumbsLabel={t("common.breadcrumbs")}
      />
      <PreferencesFields />
    </>
  );
}

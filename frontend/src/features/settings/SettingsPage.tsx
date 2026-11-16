import { useTranslations } from "next-intl";
import { PageHeader } from "@/shared/components/PageHeader";
import { ChangePasswordForm } from "./components/ChangePasswordForm";
import { PreferencesFields } from "./components/PreferencesFields";

// The layout and CSS come in step 9.
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
      <ChangePasswordForm />
    </>
  );
}

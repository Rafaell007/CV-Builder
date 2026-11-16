import { useTranslations } from "next-intl";
import { PageHeader } from "@/shared/components/PageHeader";
import { ChangePasswordForm } from "./components/ChangePasswordForm";
import { PreferencesFields } from "./components/PreferencesFields";
import styles from "./SettingsPage.module.css";

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
      <div className={styles.content}>
        <PreferencesFields />
        <ChangePasswordForm />
      </div>
    </>
  );
}

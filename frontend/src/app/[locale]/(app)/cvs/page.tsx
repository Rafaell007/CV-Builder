import { useTranslations } from "next-intl";
import { Cvs } from "@/features/cvs";
import { PageHeader } from "@/shared/components/PageHeader";

export default function CvsPage() {
  const t = useTranslations();
  const title = t("appShell.nav.cvs");

  return (
    <>
      <PageHeader
        title={title}
        breadcrumbs={[{ label: title }]}
        breadcrumbsLabel={t("common.breadcrumbs")}
      />
      <Cvs />
    </>
  );
}

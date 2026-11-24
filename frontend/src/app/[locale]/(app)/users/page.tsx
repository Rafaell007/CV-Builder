import { useTranslations } from "next-intl";
import { Users } from "@/features/users";
import { PageHeader } from "@/shared/components/PageHeader";

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
      <Users />
    </>
  );
}

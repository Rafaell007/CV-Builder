import { useTranslations } from "next-intl";
import { NotFoundScreen } from "@/features/not-found";

export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <main>
      <NotFoundScreen
        title={t("title")}
        messageLine1={t("messageLine1")}
        messageLine2={t("messageLine2")}
        goBackLabel={t("goBack")}
      />
    </main>
  );
}

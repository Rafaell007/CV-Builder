import { useTranslations } from "next-intl";

// Placeholder (PLAN §6); the real page comes with the system pages step.
export default function NotFound() {
  const t = useTranslations("common");

  return (
    <main>
      <h1>{t("pageNotFound")}</h1>
    </main>
  );
}

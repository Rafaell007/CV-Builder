import { useTranslations } from "next-intl";

/** Storybook-only sample: real app messages that change with the toolbar language. */
export function LanguageSample() {
  const t = useTranslations("common");
  return (
    <div>
      <h1>{t("employees")}</h1>
      <p>{t("appDescription")}</p>
    </div>
  );
}

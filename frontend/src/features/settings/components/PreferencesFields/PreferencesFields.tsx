"use client";

import { hasLocale, useTranslations } from "next-intl";
import { useLanguage } from "@/shared/i18n";
import { Select } from "@/shared/components";
import { THEMES, usePreferences } from "@/shared/preferences";

export function PreferencesFields() {
  const t = useTranslations("settings");
  const { theme, setTheme } = usePreferences();

  const themeOptions = THEMES.map((value) => ({ value, label: t(`theme.options.${value}`) }));

  const handleThemeChange = (value: string) => {
    const next = THEMES.find((option) => option === value);
    if (next) setTheme(next);
  };

  const { language, languages, setLanguage } = useLanguage();

  const languageOptions = languages.map((value) => ({
    value,
    label: t(`language.options.${value}`),
  }));

  const handleLanguageChange = (value: string) => {
    if (hasLocale(languages, value)) setLanguage(value);
  };

  return (
    <>
      <Select
        label={t("theme.label")}
        options={themeOptions}
        value={theme}
        onValueChange={handleThemeChange}
      />
      <Select
        label={t("language.label")}
        options={languageOptions}
        value={language}
        onValueChange={handleLanguageChange}
      />
    </>
  );
}

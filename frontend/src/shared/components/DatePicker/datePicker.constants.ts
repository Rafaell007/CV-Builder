import type { Locale as DateFnsLocale } from "date-fns";
import { enGB } from "date-fns/locale/en-GB";
import { pl } from "date-fns/locale/pl";
import type { Locale } from "next-intl";

// date-fns locale per app language: month and weekday names. The first day of the week and the date format are
// set below. "en" uses British English names: US English names days with ordinals ("November 4th"), so a day
// showing "4" fails axe's label-content-name-mismatch.
export const DATE_FNS_LOCALES: Record<Locale, DateFnsLocale> = { en: enGB, pl };

// The date shown in the field and parsed from typed text. Decided by Maciek on 2026-11-05: en month first as the
// design draws it (docs/images/23-cv-projects-page.jpg: 08/21/2023), pl day first with dots.
export const DATE_FORMATS: Record<Locale, string> = { en: "MM/dd/yyyy", pl: "dd.MM.yyyy" };

// Sunday, as the design draws the weekday row (docs/images/date-picker-layout.png), whatever the locale.
export const WEEK_START_DAY = 0;

// One page of the year list: 12 years, 3 per row.
export const YEARS_PER_PAGE = 12;

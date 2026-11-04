import type { Locale as DateFnsLocale } from "date-fns";
import { enGB } from "date-fns/locale/en-GB";
import { pl } from "date-fns/locale/pl";
import type { Locale } from "next-intl";

// date-fns locale per app language: month and weekday names, the first day of the week and the date format.
// "en" uses British English (Monday first, dd/MM/yyyy), our choice: the docs do not say which English. US English
// names days with ordinals ("November 4th"), so a day showing "4" fails axe's label-content-name-mismatch.
export const DATE_FNS_LOCALES: Record<Locale, DateFnsLocale> = { en: enGB, pl };

// date-fns "P": the locale's short date (en 04/11/2026, pl 04.11.2026), used to show and to parse typed dates.
export const DATE_FORMAT = "P";

// One page of the year list: 12 years, 3 per row.
export const YEARS_PER_PAGE = 12;

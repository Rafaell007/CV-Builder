import {
  addMonths,
  addYears,
  endOfDay,
  endOfMonth,
  endOfYear,
  getDaysInMonth,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfYear,
} from "date-fns";

// The two lists whose arrows move the saved date: one month at a time, or one year at a time.
export type StepUnit = "month" | "year";

export type StepLimits = {
  minDate?: Date | undefined;
  maxDate?: Date | undefined;
};

function clampToLimits(date: Date, { minDate, maxDate }: StepLimits): Date {
  if (minDate && date < startOfDay(minDate)) return startOfDay(minDate);
  if (maxDate && date > startOfDay(maxDate)) return startOfDay(maxDate);
  return date;
}

/**
 * The saved date after a click in the month list or the year list. `picked` is what react-datepicker reports: the
 * clicked month (with the shown year) or the clicked year. The saved day is kept and cut to the end of a shorter month
 * (31 Jan, pick February → 28 Feb). Without a saved date the picked date is used as it is (the 1st).
 */
export function applyListPick(
  value: Date | null,
  picked: Date,
  unit: StepUnit,
  limits: StepLimits,
): Date {
  if (!value) return clampToLimits(picked, limits);

  const result =
    unit === "month"
      ? new Date(
          picked.getFullYear(),
          picked.getMonth(),
          Math.min(
            value.getDate(),
            getDaysInMonth(new Date(picked.getFullYear(), picked.getMonth())),
          ),
        )
      : addYears(value, picked.getFullYear() - value.getFullYear());
  return clampToLimits(result, limits);
}

/**
 * The date an arrow starts from: the saved date. With an empty field it is the month the calendar shows:
 * today when that is today's month, else the 1st of it.
 */
export function getStepStart(value: Date | null, shownDate: Date, today: Date): Date {
  if (value) return value;
  return isSameMonth(shownDate, today) ? startOfDay(today) : startOfMonth(shownDate);
}

/**
 * The saved date after one arrow click, or null when the arrow must be disabled (the whole target month or year is
 * outside the limits). The day of the month is kept and cut to the end of a shorter month (31 Jan → 28 Feb). A target
 * that is only partly inside the limits is moved to the nearest allowed day.
 */
export function stepSelection(
  start: Date,
  unit: StepUnit,
  direction: 1 | -1,
  { minDate, maxDate }: StepLimits,
): Date | null {
  const target = unit === "month" ? addMonths(start, direction) : addYears(start, direction);
  const first = unit === "month" ? startOfMonth(target) : startOfYear(target);
  const last = unit === "month" ? endOfMonth(target) : endOfYear(target);

  if (minDate && last < startOfDay(minDate)) return null;
  if (maxDate && first > endOfDay(maxDate)) return null;

  return clampToLimits(target, { minDate, maxDate });
}

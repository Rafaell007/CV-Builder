import type { Locale as DateFnsLocale } from "date-fns";
import { format } from "date-fns";
import type { ReactDatePickerCustomHeaderProps } from "react-datepicker";
import { ChevronLeftIcon, ChevronRightIcon } from "../icons";
import { YEARS_PER_PAGE } from "./datePicker.constants";
import type { CalendarView, DatePickerLabels } from "./datePicker.types";
import styles from "./DatePicker.module.css";

export type CalendarHeaderProps = ReactDatePickerCustomHeaderProps & {
  view: CalendarView;
  locale: DateFnsLocale;
  labels: DatePickerLabels;
  onMonthClick: () => void;
  onYearClick: () => void;
};

// Figma: month and year buttons on the left, two round arrows on the right.
// The arrows page months in the day view and 12 years in the year list; the month list has none (the year button
// opens the years). aria-pressed marks the list that is open.
export function CalendarHeader({
  date,
  view,
  locale,
  labels,
  onMonthClick,
  onYearClick,
  decreaseMonth,
  increaseMonth,
  changeYear,
  prevMonthButtonDisabled,
  nextMonthButtonDisabled,
}: CalendarHeaderProps) {
  const year = date.getFullYear();

  return (
    <div className={styles.header}>
      <div className={styles.headerTitle}>
        <button
          type="button"
          aria-pressed={view === "month"}
          onClick={onMonthClick}
          className={styles.headerButton}
        >
          {/* "LLLL": the month's own name (pl "listopad", not "listopada") */}
          {format(date, "LLLL", { locale })}
        </button>
        <button
          type="button"
          aria-pressed={view === "year"}
          onClick={onYearClick}
          className={styles.headerButton}
        >
          {year}
        </button>
      </div>
      {view === "day" && (
        <div className={styles.arrows}>
          <button
            type="button"
            aria-label={labels.previousMonth}
            disabled={prevMonthButtonDisabled}
            onClick={decreaseMonth}
            className={styles.arrow}
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            aria-label={labels.nextMonth}
            disabled={nextMonthButtonDisabled}
            onClick={increaseMonth}
            className={styles.arrow}
          >
            <ChevronRightIcon />
          </button>
        </div>
      )}
      {view === "year" && (
        <div className={styles.arrows}>
          <button
            type="button"
            aria-label={labels.previousYears}
            onClick={() => changeYear(year - YEARS_PER_PAGE)}
            className={styles.arrow}
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            aria-label={labels.nextYears}
            onClick={() => changeYear(year + YEARS_PER_PAGE)}
            className={styles.arrow}
          >
            <ChevronRightIcon />
          </button>
        </div>
      )}
    </div>
  );
}

import type { Locale as DateFnsLocale } from "date-fns";
import { format } from "date-fns";
import type { ReactDatePickerCustomHeaderProps } from "react-datepicker";
import { ChevronLeftIcon, ChevronRightIcon } from "../icons";
import type { CalendarView, DatePickerLabels } from "./datePicker.types";
import styles from "./DatePicker.module.css";

export type CalendarHeaderProps = ReactDatePickerCustomHeaderProps & {
  view: CalendarView;
  locale: DateFnsLocale;
  labels: DatePickerLabels;
  // In the month list and the year list the arrows move the saved date (see useDatePicker); `shownDate` is the
  // month the calendar shows.
  isArrowDisabled: (direction: 1 | -1, shownDate: Date) => boolean;
  onArrowClick: (direction: 1 | -1, shownDate: Date) => void;
  onMonthClick: () => void;
  onYearClick: () => void;
};

// Figma: month and year buttons on the left, two round arrows on the right, in all three views
// (docs/images/date-picker-layout.png). aria-pressed marks the list that is open; it is drawn red.
// Arrows: the day view pages months. The month list moves the saved date one month, the year list one year; the list
// pages by itself when the date leaves it (December → January of the next year).
export function CalendarHeader({
  date,
  view,
  locale,
  labels,
  isArrowDisabled,
  onArrowClick,
  onMonthClick,
  onYearClick,
  decreaseMonth,
  increaseMonth,
  prevMonthButtonDisabled,
  nextMonthButtonDisabled,
}: CalendarHeaderProps) {
  const year = date.getFullYear();
  const arrows =
    view === "day"
      ? {
          previousLabel: labels.previousMonth,
          nextLabel: labels.nextMonth,
          previousDisabled: prevMonthButtonDisabled,
          nextDisabled: nextMonthButtonDisabled,
          onPrevious: decreaseMonth,
          onNext: increaseMonth,
        }
      : {
          previousLabel: view === "month" ? labels.previousMonth : labels.previousYear,
          nextLabel: view === "month" ? labels.nextMonth : labels.nextYear,
          previousDisabled: isArrowDisabled(-1, date),
          nextDisabled: isArrowDisabled(1, date),
          onPrevious: () => onArrowClick(-1, date),
          onNext: () => onArrowClick(1, date),
        };

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
      <div className={styles.arrows}>
        <button
          type="button"
          aria-label={arrows.previousLabel}
          disabled={arrows.previousDisabled}
          onClick={arrows.onPrevious}
          className={styles.arrow}
        >
          <ChevronLeftIcon />
        </button>
        <button
          type="button"
          aria-label={arrows.nextLabel}
          disabled={arrows.nextDisabled}
          onClick={arrows.onNext}
          className={styles.arrow}
        >
          <ChevronRightIcon />
        </button>
      </div>
    </div>
  );
}

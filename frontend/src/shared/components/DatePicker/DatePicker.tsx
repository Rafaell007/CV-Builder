import type { Locale } from "next-intl";
import { useRef, type Ref } from "react";
import ReactDatePicker from "react-datepicker";
import { Field, fieldInputClassName, useFieldIds } from "../Field";
import { CalendarTodayIcon } from "../icons";
import { CalendarDialog } from "./CalendarDialog";
import { CalendarHeader } from "./CalendarHeader";
import { CalendarLabelContext } from "./CalendarLabelContext";
import {
  DATE_FNS_LOCALES,
  DATE_FORMATS,
  WEEK_START_DAY,
  YEARS_PER_PAGE,
} from "./datePicker.constants";
import type { DatePickerLabels } from "./datePicker.types";
import styles from "./DatePicker.module.css";
import { useDatePicker } from "./useDatePicker";

export type DatePickerProps = {
  label: string;
  // Controlled: null means no date.
  value: Date | null;
  onValueChange: (value: Date | null) => void;
  // Runs when focus leaves the field and its calendar, React Hook Form's field.onBlur.
  onBlur?: () => void;
  // On the input, so React Hook Form can focus the field (field.ref).
  ref?: Ref<HTMLInputElement>;
  // App language: month and weekday names and the date format (Sunday is always the first day).
  locale: Locale;
  labels: DatePickerLabels;
  minDate?: Date | undefined;
  maxDate?: Date | undefined;
  id?: string;
  name?: string;
  helperText?: string | undefined;
  error?: string | undefined;
  disabled?: boolean;
  required?: boolean;
  className?: string | undefined;
};

// react-datepicker (PLAN §2.2) with our Field as the input and our own header and styles (its CSS is not loaded).
// The date can be typed in the locale's short format or picked; arrow keys move through the days.
// https://github.com/Hacker0x01/react-datepicker
export function DatePicker({
  label,
  value,
  onValueChange,
  onBlur,
  ref,
  locale,
  labels,
  minDate,
  maxDate,
  id,
  name,
  helperText,
  error,
  disabled = false,
  required = false,
  className,
}: DatePickerProps) {
  const pickerRef = useRef<ReactDatePicker>(null);
  const { controlId, helperId, errorId, controlProps } = useFieldIds({
    id,
    hasHelperText: Boolean(helperText),
    hasError: Boolean(error),
  });
  const {
    view,
    isArrowDisabled,
    onArrowClick,
    showMonthList,
    showYearList,
    onPick,
    onCalendarClose,
    onInputClick,
    onFocusLeave,
  } = useDatePicker({
    value,
    minDate,
    maxDate,
    onValueChange,
    onBlur,
    ref,
    controlId,
    // skipSetBlur: the focus stays in the input
    closeCalendar: () => pickerRef.current?.setOpen(false, true),
  });
  const dateFnsLocale = DATE_FNS_LOCALES[locale];

  return (
    <Field
      label={label}
      controlId={controlId}
      helperId={helperId}
      errorId={errorId}
      helperText={helperText}
      error={error}
      className={className}
    >
      <div className={styles.box} onBlur={onFocusLeave}>
        <CalendarLabelContext value={labels.calendar}>
          <ReactDatePicker
            // One date: picks react-datepicker's single-date props (its types are a union of single / range / multiple)
            ref={pickerRef}
            selectsRange={false}
            selectsMultiple={false}
            selected={value}
            onChange={onPick}
            onCalendarClose={onCalendarClose}
            onInputClick={onInputClick}
            // Closed by the year pick (useDatePicker), not by a day pick
            shouldCloseOnSelect={false}
            showMonthYearPicker={view === "month"}
            showYearPicker={view === "year"}
            yearItemNumber={YEARS_PER_PAGE}
            locale={dateFnsLocale}
            dateFormat={DATE_FORMATS[locale]}
            calendarStartDay={WEEK_START_DAY}
            // The design shows full month names ("January"), not the short ones
            renderMonthContent={(_monthIndex, _shortName, fullName) => fullName}
            // react-datepicker's types take no explicit undefined (exactOptionalPropertyTypes): set only when given
            {...(minDate && { minDate })}
            {...(maxDate && { maxDate })}
            {...(name && { name })}
            {...(error && { ariaInvalid: "true" })}
            {...(controlProps["aria-describedby"] && {
              ariaDescribedBy: controlProps["aria-describedby"],
            })}
            id={controlId}
            disabled={disabled}
            required={required}
            // Field needs placeholder=" " to know when the input is empty; the label plays the placeholder
            placeholderText=" "
            autoComplete="off"
            customInput={<input className={fieldInputClassName} />}
            calendarContainer={CalendarDialog}
            renderCustomHeader={(headerProps) => (
              <CalendarHeader
                {...headerProps}
                view={view}
                locale={dateFnsLocale}
                labels={labels}
                isArrowDisabled={isArrowDisabled}
                onArrowClick={onArrowClick}
                onMonthClick={showMonthList}
                onYearClick={showYearList}
              />
            )}
            chooseDayAriaLabelPrefix={labels.chooseDayPrefix}
            disabledDayAriaLabelPrefix={labels.unavailableDayPrefix}
            monthAriaLabelPrefix={labels.monthPrefix}
            showPopperArrow={false}
            popperPlacement="bottom-start"
            // CSS Module names are typed string | undefined; react-datepicker wants a string
            wrapperClassName={styles.wrapper ?? ""}
            popperClassName={styles.popper ?? ""}
            calendarClassName={styles.calendar ?? ""}
          />
        </CalendarLabelContext>
        <CalendarTodayIcon className={styles.icon} />
      </div>
    </Field>
  );
}

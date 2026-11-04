import { useImperativeHandle, useState, type FocusEvent, type Ref } from "react";
import type { CalendarView } from "./datePicker.types";

export type UseDatePickerOptions = {
  onValueChange: (value: Date | null) => void;
  onBlur: (() => void) | undefined;
  // The caller's ref (React Hook Form's field.ref): receives the input.
  ref: Ref<HTMLInputElement> | undefined;
  controlId: string;
};

// The calendar's view and what a pick means in each view:
// a day sets the value and closes; a month opens that month's days; a year opens that year's months.
// react-datepicker keeps the shown month itself, so switching the view back to "day" shows the picked month.
export function useDatePicker({ onValueChange, onBlur, ref, controlId }: UseDatePickerOptions) {
  const [view, setView] = useState<CalendarView>("day");

  // react-datepicker keeps its own ref on the input; the caller gets the same element, found by its id.
  useImperativeHandle(ref, () => document.getElementById(controlId) as HTMLInputElement, [
    controlId,
  ]);

  return {
    view,
    showMonthList: () => setView("month"),
    showYearList: () => setView("year"),
    onPick: (date: Date | null) => {
      if (view === "year") setView("month");
      else if (view === "month") setView("day");
      else onValueChange(date);
    },
    // Only a day pick closes the calendar; the next opening starts on the days again.
    shouldCloseOnSelect: view === "day",
    onCalendarClose: () => setView("day"),
    // Focus moving between the input and the calendar stays inside the field: not a blur for the form.
    onFocusLeave: (event: FocusEvent<HTMLElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget)) onBlur?.();
    },
  };
}

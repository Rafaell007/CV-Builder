import { useState, type Ref } from "react";
import { useElementByIdRef } from "@/shared/hooks";
import { createFocusLeaveHandler } from "@/shared/utils";
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
  useElementByIdRef(ref, controlId);

  return {
    view,
    showMonthList: () => setView("month"),
    showYearList: () => setView("year"),
    // react-datepicker calls onChange for a pick and for typed text; typed text always sets the value, whatever the view.
    onPick: (date: Date | null, event?: { type: string } | undefined) => {
      if (event?.type === "change") onValueChange(date);
      else if (view === "year") setView("month");
      else if (view === "month") setView("day");
      else onValueChange(date);
    },
    // Only a day pick closes the calendar; the next opening starts on the days again.
    shouldCloseOnSelect: view === "day",
    onCalendarClose: () => setView("day"),
    // Focus moving between the input and the calendar stays inside the field: not a blur for the form.
    onFocusLeave: createFocusLeaveHandler(onBlur),
  };
}

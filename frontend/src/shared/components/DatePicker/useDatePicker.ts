import { useState, type Ref } from "react";
import { useElementByIdRef } from "@/shared/hooks";
import { createFocusLeaveHandler } from "@/shared/utils";
import type { CalendarView } from "./datePicker.types";
import { applyListPick, getStepStart, stepSelection, type StepLimits } from "./utils";

export type UseDatePickerOptions = StepLimits & {
  value: Date | null;
  onValueChange: (value: Date | null) => void;
  onBlur: (() => void) | undefined;
  // The caller's ref (React Hook Form's field.ref): receives the input.
  ref: Ref<HTMLInputElement> | undefined;
  controlId: string;
  // Closes the calendar and keeps the focus in the input.
  closeCalendar: () => void;
};

// The calendar's view and what a pick means in each view:
// the steps run day → month list → year list; each pick saves the date, and the year pick closes the calendar.
// The month and year buttons of the header are shortcuts into the second and third step.
// react-datepicker keeps the shown month itself, so switching the view back to "day" shows the picked month.
export function useDatePicker({
  value,
  minDate,
  maxDate,
  onValueChange,
  onBlur,
  ref,
  controlId,
  closeCalendar,
}: UseDatePickerOptions) {
  const [view, setView] = useState<CalendarView>("day");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // react-datepicker keeps its own ref on the input; the caller gets the same element, found by its id.
  useElementByIdRef(ref, controlId);

  // The date one arrow click in a list would save, or null (arrow disabled). `shownDate` is the month the calendar
  // shows: where an empty field starts. The day view's arrows only page, so they never come here.
  const getArrowTarget = (direction: 1 | -1, shownDate: Date) =>
    view === "day"
      ? null
      : stepSelection(getStepStart(value, shownDate, new Date()), view, direction, {
          minDate,
          maxDate,
        });

  return {
    view,
    isCalendarOpen,
    onCalendarOpen: () => setIsCalendarOpen(true),
    // In the month list and the year list an arrow moves the saved date and the list follows it (a day view arrow only pages).
    isArrowDisabled: (direction: 1 | -1, shownDate: Date) =>
      getArrowTarget(direction, shownDate) === null,
    onArrowClick: (direction: 1 | -1, shownDate: Date) => {
      const target = getArrowTarget(direction, shownDate);
      if (target) onValueChange(target);
    },
    showMonthList: () => setView("month"),
    showYearList: () => setView("year"),
    // react-datepicker calls onChange for a pick and for typed text; typed text always sets the value, whatever the view.
    // Every pick saves the date at once, then leads to the next step: day → month list → year list → closed.
    onPick: (date: Date | null, event?: { type: string } | undefined) => {
      if (event?.type === "change" || !date) {
        onValueChange(date);
      } else if (view === "day") {
        onValueChange(date);
        setView("month");
      } else if (view === "month") {
        onValueChange(applyListPick(value, date, "month", { minDate, maxDate }));
        setView("year");
      } else {
        onValueChange(applyListPick(value, date, "year", { minDate, maxDate }));
        setView("day");
        closeCalendar();
      }
    },
    // The calendar closes only after the year pick (closeCalendar), never by react-datepicker's own select rule.
    // The next opening starts on the days again.
    onCalendarClose: () => {
      setView("day");
      setIsCalendarOpen(false);
    },
    // A click in the input while a list is open closes the calendar: the lists have no way back to the days, and
    // the next opening starts on the days. In the day view the click only places the cursor, for typing.
    onInputClick: () => {
      if (view !== "day") closeCalendar();
    },
    // Focus moving between the input and the calendar stays inside the field: not a blur for the form.
    onFocusLeave: createFocusLeaveHandler(onBlur),
  };
}

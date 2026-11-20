import { useEffect, useRef, useState, type KeyboardEvent, type RefObject, type Ref } from "react";
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
  // The box around the input and the calendar: where the focus is moved to.
  boxRef: RefObject<HTMLElement | null>;
  // Opens the calendar (the focus alone does not).
  openCalendar: () => void;
  // Closes the calendar and keeps the focus in the input.
  closeCalendar: () => void;
};

const FOCUS_ATTEMPTS = 10;
const OPEN_KEYS = new Set(["Enter", "ArrowDown", "ArrowUp"]);

// The cell that holds the focus in each list (react-datepicker gives tabindex 0 to the pre-selected one).
const FOCUS_TARGETS: Record<CalendarView, string> = {
  day: '.react-datepicker__day[tabindex="0"]',
  month: '.react-datepicker__month-text[tabindex="0"]',
  year: '.react-datepicker__year-text[tabindex="0"]',
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
  boxRef,
  openCalendar,
  closeCalendar,
}: UseDatePickerOptions) {
  const [view, setView] = useState<CalendarView>("day");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  // Keyboard users: focus moves into the calendar when Enter or an arrow opens it, and after a pick with Enter
  // (see the effect below). A mouse user keeps the focus in the input, so typing still works.
  const focusPending = useRef(false);

  useEffect(() => {
    if (!focusPending.current || !isCalendarOpen) return;
    // The calendar (or the next list) may reach the DOM a frame or two after the state change: try a few frames.
    let frame = 0;
    let attempts = 0;
    const tryFocus = () => {
      const target = boxRef.current?.querySelector<HTMLElement>(FOCUS_TARGETS[view]);
      if (target) {
        focusPending.current = false;
        target.focus({ preventScroll: true });
      } else if (attempts++ < FOCUS_ATTEMPTS) {
        frame = requestAnimationFrame(tryFocus);
      }
    };
    tryFocus();
    return () => cancelAnimationFrame(frame);
  }, [isCalendarOpen, view, boxRef]);

  // The input gets the focus back before the calendar closes: the focused cell is removed with the calendar.
  const returnFocusToInput = () =>
    document.getElementById(controlId)?.focus({ preventScroll: true });

  // Escape closes the calendar. react-datepicker may still move the focus to a day after returnFocusToInput; that day
  // is removed with the calendar and the focus falls to <body> (seen only on the CI runner, KAN-164). When the
  // calendar has closed after Escape and nothing holds the focus, the input gets it back.
  const closedByEscape = useRef(false);
  const restoreFocusAfterEscape = () => {
    if (!closedByEscape.current) return;
    closedByEscape.current = false;
    // A timeout runs after react-datepicker's own focus timer
    setTimeout(() => {
      if (document.activeElement === document.body) returnFocusToInput();
    }, 0);
  };

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
    onCalendarOpen: () => {
      closedByEscape.current = false;
      setIsCalendarOpen(true);
    },
    // A focused date field does not open its calendar (Tab must pass over it): Enter or an arrow does, and the
    // focus moves into it. Enter is stopped here so it does not submit the form. A click opens it without this.
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      const { key, target } = event;
      if (key === "Escape" && isCalendarOpen) {
        closedByEscape.current = true;
        returnFocusToInput();
      }
      if (isCalendarOpen || !OPEN_KEYS.has(key)) return;
      if (!(target instanceof HTMLInputElement) || target.id !== controlId) return;
      event.preventDefault();
      focusPending.current = true;
      openCalendar();
    },
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
        // Enter on a day (a click keeps the focus in the input): the focus follows into the month list
        focusPending.current = event?.type === "keydown";
        setView("month");
      } else if (view === "month") {
        onValueChange(applyListPick(value, date, "month", { minDate, maxDate }));
        focusPending.current = event?.type === "keydown";
        setView("year");
      } else {
        onValueChange(applyListPick(value, date, "year", { minDate, maxDate }));
        setView("day");
        returnFocusToInput();
        closeCalendar();
      }
    },
    // The calendar closes only after the year pick (closeCalendar), never by react-datepicker's own select rule.
    // The next opening starts on the days again.
    onCalendarClose: () => {
      restoreFocusAfterEscape();
      focusPending.current = false;
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

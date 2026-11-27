import { createContext } from "react";

// The calendar popup's translated name. react-datepicker renders CalendarDialog itself (calendarContainer prop),
// so the label cannot come in as a prop; a new component per label would remount the calendar on every render.
export const CalendarLabelContext = createContext("");

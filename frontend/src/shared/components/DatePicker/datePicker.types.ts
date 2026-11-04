// What the calendar shows: days of a month, the 12 months of a year, or a page of years.
export type CalendarView = "day" | "month" | "year";

// Screen-reader texts of the calendar, translated by the caller (react-datepicker's own are English only).
export type DatePickerLabels = {
  // The popup's name, e.g. "Choose a date"
  calendar: string;
  previousMonth: string;
  nextMonth: string;
  // Arrows of the year list (a page of 12 years)
  previousYears: string;
  nextYears: string;
  // Put before a day's full date: "Choose" → "Choose Wednesday, 4 November 2026"
  chooseDayPrefix: string;
  // Put before a day that cannot be chosen: "Not available"
  unavailableDayPrefix: string;
  // Put before the month's name on the day grid: "Month" → "Month November, 2026"
  monthPrefix: string;
};

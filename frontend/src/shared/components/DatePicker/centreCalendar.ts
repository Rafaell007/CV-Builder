import type { DatePickerProps } from "react-datepicker";

type PopperModifier = NonNullable<DatePickerProps["popperModifiers"]>[number];

// Puts the open calendar in the middle of the screen, whatever the field or the modal does (KAN-136).
// The calendar uses position: fixed, so the coordinates are relative to the screen: no scroll offset.
export const centreCalendar: PopperModifier = {
  name: "centreCalendar",
  fn: ({ rects }) => ({
    x: (document.documentElement.clientWidth - rects.floating.width) / 2,
    y: (window.innerHeight - rects.floating.height) / 2,
  }),
};

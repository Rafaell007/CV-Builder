import type { DatePickerProps } from "react-datepicker";

type PopperModifier = NonNullable<DatePickerProps["popperModifiers"]>[number];

// Puts the open calendar in the middle of the screen, whatever the field or the modal does (KAN-136).
// The coordinates are relative to the page, so the scroll offset is added back.
export const centreCalendar: PopperModifier = {
  name: "centreCalendar",
  fn: ({ rects }) => ({
    x: (document.documentElement.clientWidth - rects.floating.width) / 2 + window.scrollX,
    y: (window.innerHeight - rects.floating.height) / 2 + window.scrollY,
  }),
};

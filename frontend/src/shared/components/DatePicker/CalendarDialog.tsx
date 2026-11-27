import { use, type MouseEvent, type ReactNode } from "react";
import { CalendarLabelContext } from "./CalendarLabelContext";

// Replaces react-datepicker's calendar container, whose name is the English "Choose Date".
// A mouse click inside keeps focus in the input: a clicked header button would otherwise hold focus, and when a
// click outside closes the calendar that button disappears without a blur, so the form never sees the field left.
// Keyboard users still move into the calendar with the arrow keys.
const keepFocusInInput = (event: MouseEvent) => event.preventDefault();

export function CalendarDialog({
  className,
  children,
}: {
  className?: string | undefined;
  children?: ReactNode;
}) {
  return (
    <div
      className={className}
      role="dialog"
      aria-label={use(CalendarLabelContext)}
      onMouseDown={keepFocusInInput}
    >
      {children}
    </div>
  );
}

import type { FocusEvent } from "react";

// A blur handler for a wrapper around several focusable parts (input + calendar, toggle + × buttons, digit boxes).
// Focus moving between the parts stays inside the field, so it is not a blur for the form; only leaving the wrapper is.
export function createFocusLeaveHandler(onBlur: (() => void) | undefined) {
  return (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) onBlur?.();
  };
}

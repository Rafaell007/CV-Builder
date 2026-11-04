import { useRef } from "react";

// Opening the list moves focus from the trigger into the list (a portal). That is not "leaving the field",
// so the caller's onBlur runs only when focus leaves while the list is closed. React Hook Form's onTouched
// mode then validates after the user moves on, not while they are choosing.
// Radix calls onOpenChange(true) before the list takes focus, so the ref is already set when the blur fires.
export function useTriggerBlur(onBlur: (() => void) | undefined) {
  const isOpenRef = useRef(false);

  return {
    onOpenChange: (open: boolean) => {
      isOpenRef.current = open;
    },
    onTriggerBlur: () => {
      if (!isOpenRef.current) onBlur?.();
    },
  };
}

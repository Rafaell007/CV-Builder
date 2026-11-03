import { useCallback, useEffect, useRef } from "react";

// Calls `callback` once the calls stop for `delayMs` (e.g. search after the user stops typing), with the last arguments.
// `cancel` drops a pending call. A pending call is also dropped on unmount.
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs: number,
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Always call the latest callback, without restarting the timer when the parent re-renders.
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });

  const cancel = useCallback(() => clearTimeout(timeoutRef.current), []);

  useEffect(() => cancel, [cancel]);

  const debounced = useCallback(
    (...args: Args) => {
      cancel();
      timeoutRef.current = setTimeout(() => callbackRef.current(...args), delayMs);
    },
    [cancel, delayMs],
  );

  return { debounced, cancel };
}

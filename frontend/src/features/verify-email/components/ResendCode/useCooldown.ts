"use client";

import { useEffect, useState } from "react";

/**
 * A countdown in whole seconds. `start(seconds)` begins it; `secondsLeft` is 0 when it is not running.
 * The end is kept as a time, not as a counter, so a tab that slept in the background still shows the right value.
 */
export function useCooldown() {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (endsAt === null) return;

    const id = setInterval(() => {
      const left = Math.max(Math.ceil((endsAt - Date.now()) / 1000), 0);
      setSecondsLeft(left);
      if (left === 0) setEndsAt(null);
    }, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  function start(seconds: number) {
    setEndsAt(Date.now() + seconds * 1000);
    setSecondsLeft(seconds);
  }

  return { secondsLeft, start };
}

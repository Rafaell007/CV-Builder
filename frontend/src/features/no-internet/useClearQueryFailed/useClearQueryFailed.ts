"use client";

import { useEffect } from "react";
import { clearQueryFailed } from "@/shared/network";

// The error page shows its own No Internet screen; this hides the gate's copy, so one RETRY is enough.
export function useClearQueryFailed(): void {
  useEffect(() => {
    clearQueryFailed();
  }, []);
}

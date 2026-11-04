"use client";

import { createContext } from "react";
import type { ToastContent } from "./Toast.types";

export type ShowToast = (content: ToastContent) => void;

export interface ToastContextValue {
  success: ShowToast;
  error: ShowToast;
  warning: ShowToast;
  info: ShowToast;
}

// null = used outside ToastProvider (useToast throws).
export const ToastContext = createContext<ToastContextValue | null>(null);

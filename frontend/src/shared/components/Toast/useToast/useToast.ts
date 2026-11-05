"use client";

import { useContext } from "react";
import { ToastContext, type ToastContextValue } from "../ToastContext";

// Shows a toast: `toast.success({ title, description })`; texts are already translated.
export const useToast = (): ToastContextValue => {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast must be used inside ToastProvider");
  return value;
};

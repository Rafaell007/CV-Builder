export type ToastVariant = "success" | "error" | "warning" | "info";

/** What a caller passes; texts are already translated. */
export interface ToastContent {
  title: string;
  description?: string;
}

/** One toast in the provider's list. `open: false` keeps it mounted while its exit animation runs. */
export interface ToastEntry extends ToastContent {
  id: string;
  variant: ToastVariant;
  open: boolean;
}

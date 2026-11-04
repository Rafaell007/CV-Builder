import { AlertDialog } from "radix-ui";
import type { ReactNode } from "react";
import { useReturnFocus } from "@/shared/hooks";
import { Button } from "../Button";
import { CloseButton } from "../CloseButton";
import styles from "./ConfirmModal.module.css";

export interface ConfirmModalProps {
  open: boolean;
  /** Called with `false` on CANCEL, Escape and the × button. A click outside does not close it. */
  onOpenChange: (open: boolean) => void;
  /** Callers pass translated texts for every label. */
  title: string;
  /** E.g. "Are you sure you want to remove <strong>3 skills</strong>?"; the caller marks the highlighted part. */
  message: ReactNode;
  closeLabel: string;
  confirmLabel: string;
  cancelLabel: string;
  /** Sends the request. The caller closes the modal only after it succeeds. */
  onConfirm: () => void;
  /** Shows the confirm button's loading state and blocks a second request. */
  isPending: boolean;
}

/**
 * "Are you sure?" dialog for deletes, on Radix AlertDialog: role "alertdialog", focus starts on CANCEL
 * (the safe choice), a click outside does not close it. CONFIRM is a plain button, not `AlertDialog.Action`,
 * because Action would close the dialog before the request finishes.
 */
export function ConfirmModal({
  open,
  onOpenChange,
  title,
  message,
  closeLabel,
  confirmLabel,
  cancelLabel,
  onConfirm,
  isPending,
}: ConfirmModalProps) {
  const returnFocus = useReturnFocus();

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className={styles.overlay} />
        <AlertDialog.Content
          onOpenAutoFocus={returnFocus.onOpenAutoFocus}
          onCloseAutoFocus={returnFocus.onCloseAutoFocus}
          className={styles.content}
        >
          <div className={styles.header}>
            <AlertDialog.Title className={styles.title}>{title}</AlertDialog.Title>
            <AlertDialog.Cancel asChild>
              <CloseButton aria-label={closeLabel} className={styles.close} />
            </AlertDialog.Cancel>
          </div>
          <AlertDialog.Description className={styles.message}>{message}</AlertDialog.Description>
          <div className={styles.footer}>
            <AlertDialog.Cancel asChild>
              <Button variant="secondary">{cancelLabel}</Button>
            </AlertDialog.Cancel>
            <Button loading={isPending} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

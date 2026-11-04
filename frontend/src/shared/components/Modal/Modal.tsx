import { Dialog } from "radix-ui";
import type { ReactNode } from "react";
import { useReturnFocus } from "@/shared/hooks";
import { CloseButton } from "../CloseButton";
import styles from "./Modal.module.css";

export interface ModalProps {
  open: boolean;
  /** Called with `false` on Escape, a click on the overlay and the close button. */
  onOpenChange: (open: boolean) => void;
  /** The dialog's accessible name. Callers pass a translated text, as for every text below. */
  title: string;
  /** Optional text under the title; screen readers read it when the dialog opens. */
  description?: ReactNode;
  /** Accessible name of the close (×) button. */
  closeLabel: string;
  /** Buttons, right-aligned under the content. */
  footer?: ReactNode;
  children?: ReactNode;
}

/**
 * Controlled modal dialog. Radix traps focus inside, closes on Escape and locks page scroll;
 * useReturnFocus returns focus to the element that opened it (Radix does that only for its own Trigger).
 */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  closeLabel,
  footer,
  children,
}: ModalProps) {
  const returnFocus = useReturnFocus();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content
          {...returnFocus}
          className={styles.content}
          // Without a Description part Radix asks for an explicit "no description".
          {...(description === undefined && { "aria-describedby": undefined })}
        >
          <div className={styles.header}>
            <Dialog.Title className={styles.title}>{title}</Dialog.Title>
            <Dialog.Close asChild>
              <CloseButton aria-label={closeLabel} className={styles.close} />
            </Dialog.Close>
          </div>
          {description !== undefined && (
            <Dialog.Description className={styles.description}>{description}</Dialog.Description>
          )}
          {children}
          {footer !== undefined && <div className={styles.footer}>{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

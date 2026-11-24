import { Dialog } from "radix-ui";
import type { ReactNode } from "react";
import { useReturnFocus } from "@/shared/hooks";
import { CloseButton } from "../CloseButton";
import styles from "./Modal.module.css";

const CALENDAR_OPEN_SELECTOR = "[data-calendar-open]";

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
  /** Runs when the modal opens, before Radix focuses its first button; `event.preventDefault()` keeps your own focus. */
  onOpenAutoFocus?: (event: Event) => void;
  /** `"wide"`: 860px from 1024px up, for a form with two fields per row (Create user). Below 1024px both are 620px. */
  size?: ModalSize | undefined;
  children?: ReactNode;
}

export type ModalSize = "default" | "wide";

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
  onOpenAutoFocus,
  size = "default",
  children,
}: ModalProps) {
  const returnFocus = useReturnFocus();
  // `false` and `null` come from conditional JSX (`hasHint && hint`); they mean "no description" too.
  const hasDescription = description !== undefined && description !== null && description !== false;

  // One Escape closes one layer. Radix hears Escape on the document before the focused field, so it cannot tell
  // that a popup inside the modal (the DatePicker calendar, marked data-calendar-open) is open. The popup closes
  // itself; the modal stays open.
  function handleEscapeKeyDown(event: KeyboardEvent) {
    const target = event.target;
    if (target instanceof Element && target.closest(CALENDAR_OPEN_SELECTOR)) event.preventDefault();
  }

  function handleOpenAutoFocus(event: Event) {
    returnFocus.onOpenAutoFocus();
    onOpenAutoFocus?.(event);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content
          onOpenAutoFocus={handleOpenAutoFocus}
          onEscapeKeyDown={handleEscapeKeyDown}
          onCloseAutoFocus={returnFocus.onCloseAutoFocus}
          className={size === "wide" ? `${styles.content} ${styles.wide}` : styles.content}
          // Without a Description part Radix asks for an explicit "no description".
          {...(!hasDescription && { "aria-describedby": undefined })}
        >
          <div className={styles.header}>
            <Dialog.Title className={styles.title}>{title}</Dialog.Title>
            <Dialog.Close asChild>
              <CloseButton aria-label={closeLabel} className={styles.close} />
            </Dialog.Close>
          </div>
          {hasDescription && (
            <Dialog.Description className={styles.description}>{description}</Dialog.Description>
          )}
          {children}
          {footer !== undefined && <div className={styles.footer}>{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

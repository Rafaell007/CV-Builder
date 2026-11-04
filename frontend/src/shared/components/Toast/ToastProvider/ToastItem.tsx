import { Toast } from "radix-ui";
import type { AnimationEvent } from "react";
import { CloseButton } from "../../CloseButton";
import { ANNOUNCEMENT_BY_VARIANT } from "../toast.constants";
import type { ToastContent, ToastVariant } from "../Toast.types";
import styles from "./ToastItem.module.css";

export interface ToastItemProps extends ToastContent {
  variant: ToastVariant;
  open: boolean;
  /** Called with `false` by the close button, Escape, a swipe and the timer. */
  onOpenChange: (open: boolean) => void;
  /** Called when the exit animation has ended, so the toast can leave the list. */
  onExitComplete: () => void;
  /** Accessible name of the close (×) button. */
  closeLabel: string;
}

/** One toast. Radix keeps it mounted after `open` turns false until the exit animation ends. */
export function ToastItem({
  variant,
  title,
  description,
  open,
  onOpenChange,
  onExitComplete,
  closeLabel,
}: ToastItemProps) {
  function handleAnimationEnd(event: AnimationEvent<HTMLLIElement>) {
    // Animations inside the toast bubble up here too; only the toast's own exit counts.
    if (event.target === event.currentTarget && event.currentTarget.dataset.state === "closed") {
      onExitComplete();
    }
  }

  return (
    <Toast.Root
      open={open}
      onOpenChange={onOpenChange}
      type={ANNOUNCEMENT_BY_VARIANT[variant]}
      onAnimationEnd={handleAnimationEnd}
      className={`${styles.toast} ${styles[variant]}`}
    >
      <div className={styles.header}>
        <Toast.Title className={styles.title}>{title}</Toast.Title>
        <Toast.Close asChild>
          <CloseButton aria-label={closeLabel} />
        </Toast.Close>
      </div>
      {description !== undefined && (
        <Toast.Description className={styles.description}>{description}</Toast.Description>
      )}
    </Toast.Root>
  );
}

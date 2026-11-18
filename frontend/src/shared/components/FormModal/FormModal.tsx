import { useId, type FormEvent, type ReactNode } from "react";
import { Button } from "../Button";
import { Modal } from "../Modal";
import styles from "./FormModal.module.css";
import { useFirstFieldFocus } from "./useFirstFieldFocus";

export interface FormModalProps {
  open: boolean;
  /** Called with `false` on CANCEL, Escape, the overlay and the × button. */
  onOpenChange: (open: boolean) => void;
  /** Callers pass translated texts for every label. */
  title: string;
  closeLabel: string;
  submitLabel: string;
  cancelLabel: string;
  /** Enables the submit button; the caller passes `formState.isValid && formState.isDirty`. */
  canSubmit: boolean;
  /** Shows the button's loading state and blocks a second submit. */
  isSubmitting: boolean;
  /** React Hook Form's `handleSubmit(...)`. The caller closes the modal only after a successful request. */
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  /** The form's fields. */
  children: ReactNode;
}

/**
 * Modal with a form (create and update). It only displays the form's state: values, errors
 * (server errors too, via applyServerFieldErrors) and closing stay with the caller, so a failed request keeps
 * the entered values. The buttons live in the modal footer and join the form through the `form` attribute.
 */
export function FormModal({
  open,
  onOpenChange,
  title,
  closeLabel,
  submitLabel,
  cancelLabel,
  canSubmit,
  isSubmitting,
  onSubmit,
  children,
}: FormModalProps) {
  const formId = useId();
  const { formRef, onOpenAutoFocus } = useFirstFieldFocus();

  // Enter in a field submits the form too, so the guard is here, not only on the button.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!canSubmit || isSubmitting) {
      event.preventDefault();
      return;
    }
    onSubmit(event);
  }

  // While the request runs, Escape, the overlay, × and CANCEL do nothing: the caller handles the result here.
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isSubmitting) return;
    onOpenChange(nextOpen);
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      closeLabel={closeLabel}
      onOpenAutoFocus={onOpenAutoFocus}
      footer={
        <>
          <Button variant="secondary" onClick={() => handleOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button type="submit" form={formId} disabled={!canSubmit} loading={isSubmitting}>
            {submitLabel}
          </Button>
        </>
      }
    >
      {/* tabIndex -1: the form can hold the focus on open (useFirstFieldFocus) but is not a Tab stop */}
      <form
        ref={formRef}
        id={formId}
        tabIndex={-1}
        className={styles.form}
        onSubmit={handleSubmit}
        noValidate
      >
        {children}
      </form>
    </Modal>
  );
}

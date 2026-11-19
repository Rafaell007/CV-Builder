import { useTranslations } from "next-intl";
import { FormModal, TextField } from "@/shared/components";
import type { CatalogNamespace } from "../../catalogs.types";
import type { UseCreateCatalogItemFormResult } from "../../useCreateCatalogItemForm";
import styles from "./NameFormModal.module.css";

export interface NameFormModalProps {
  /** Which catalog's texts to show: `catalogs.departments` or `catalogs.positions`. */
  namespace: CatalogNamespace;
  /** Create shows "Create …" with CREATE; Update shows "Edit …" with SAVE. */
  kind: "create" | "update";
  /** The state of the flow (`useCreateCatalogItemForm` or `useUpdateCatalogItemForm`: both have this shape). */
  nameForm: Pick<
    UseCreateCatalogItemFormResult,
    "form" | "failed" | "hasChanged" | "isOpen" | "setOpen" | "submit"
  >;
}

/** The Create or Update modal of a catalog: one name field with its errors, and the submit and CANCEL buttons. */
export function NameFormModal({ namespace, kind, nameForm }: NameFormModalProps) {
  const t = useTranslations(namespace);
  const { form, failed, hasChanged, isOpen, setOpen, submit } = nameForm;
  const { isValid, isSubmitting, errors } = form.formState;

  return (
    <FormModal
      open={isOpen}
      onOpenChange={setOpen}
      title={t(`${kind}.title`)}
      closeLabel={t(`${kind}.close`)}
      submitLabel={t(`${kind}.submit`)}
      cancelLabel={t(`${kind}.cancel`)}
      canSubmit={isValid && hasChanged}
      isSubmitting={isSubmitting}
      onSubmit={(event) => void submit(event)}
    >
      <TextField
        {...form.register("name")}
        label={t("form.fields.name")}
        required
        error={errors.name?.message}
      />
      {failed && (
        <p role="alert" className={styles.error}>
          {t("form.errors.failed")}
        </p>
      )}
    </FormModal>
  );
}

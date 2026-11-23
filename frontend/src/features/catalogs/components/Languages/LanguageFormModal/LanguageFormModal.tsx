import { useTranslations } from "next-intl";
import { FormModal, TextField } from "@/shared/components";
import type { UseCreateLanguageFormResult } from "../useCreateLanguageForm";
import styles from "./LanguageFormModal.module.css";

export interface LanguageFormModalProps {
  /** Create shows "Create language" with CREATE; Update shows "Update language" with UPDATE. */
  kind: "create" | "update";
  /** The state of the flow (`useCreateLanguageForm` or `useUpdateLanguageForm`: both have this shape). */
  languageForm: Pick<
    UseCreateLanguageFormResult,
    "form" | "failed" | "hasChanged" | "isoField" | "isOpen" | "setOpen" | "submit"
  >;
}

/**
 * The Create or Update language modal: the Name, ISO and Native name fields with their errors, and the submit and
 * CANCEL buttons. The ISO field shows the typed letters uppercase.
 */
export function LanguageFormModal({ kind, languageForm }: LanguageFormModalProps) {
  const t = useTranslations("catalogs.languages");
  const { form, failed, hasChanged, isoField, isOpen, setOpen, submit } = languageForm;
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
      <TextField {...isoField} label={t("form.fields.iso")} required error={errors.iso?.message} />
      <TextField
        {...form.register("nativeName")}
        label={t("form.fields.nativeName")}
        required
        error={errors.nativeName?.message}
      />
      {failed && (
        <p role="alert" className={styles.error}>
          {t("form.errors.failed")}
        </p>
      )}
    </FormModal>
  );
}

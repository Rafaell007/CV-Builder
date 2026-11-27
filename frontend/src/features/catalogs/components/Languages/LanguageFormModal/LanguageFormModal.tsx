import { useTranslations } from "next-intl";
import { FormErrorMessage, FormModal, TextField } from "@/shared/components";
import type { UseCreateLanguageFormResult } from "../useCreateLanguageForm";
import styles from "./LanguageFormModal.module.css";

export interface LanguageFormModalProps {
  /** Create shows "Create language" with CREATE; Update shows "Update language" with UPDATE. */
  kind: "create" | "update";
  /** The state of the flow (`useCreateLanguageForm` or `useUpdateLanguageForm`: both have this shape). */
  languageForm: Pick<
    UseCreateLanguageFormResult,
    "form" | "failed" | "hasChanged" | "isOpen" | "setOpen" | "submit"
  >;
}

/**
 * The Create or Update language modal: the Name, ISO and Native name fields with their errors, and the submit and
 * CANCEL buttons. The ISO field shows the typed letters uppercase (CSS only; the value is uppercased on submit).
 */
export function LanguageFormModal({ kind, languageForm }: LanguageFormModalProps) {
  const t = useTranslations("catalogs.languages");
  const { form, failed, hasChanged, isOpen, setOpen, submit } = languageForm;
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
      <TextField
        {...form.register("iso")}
        className={styles.iso}
        label={t("form.fields.iso")}
        required
        error={errors.iso?.message}
      />
      <TextField
        {...form.register("nativeName")}
        label={t("form.fields.nativeName")}
        required
        error={errors.nativeName?.message}
      />
      {failed && <FormErrorMessage>{t("form.errors.failed")}</FormErrorMessage>}
    </FormModal>
  );
}

import { useTranslations } from "next-intl";
import { Textarea, TextField } from "@/shared/components";
import type { UseCvFormResult } from "../../useCvForm";
import styles from "./CvFormFields.module.css";

export interface CvFormFieldsProps {
  /** The form of the modal (`useCvForm`): the fields, their errors and the general error. */
  cvForm: Pick<UseCvFormResult, "form" | "failed">;
}

/**
 * The fields of a CV form (name, education and description) and its general error message. It renders only
 * the fields: the modal around it owns the title, the buttons and the submit.
 */
export function CvFormFields({ cvForm }: CvFormFieldsProps) {
  const t = useTranslations("cvs.form");
  const { form, failed } = cvForm;
  const { register } = form;
  const { errors } = form.formState;

  return (
    <>
      <TextField
        {...register("name")}
        label={t("fields.name")}
        required
        error={errors.name?.message}
      />
      <TextField
        {...register("education")}
        label={t("fields.education")}
        required
        error={errors.education?.message}
      />
      <Textarea
        {...register("description")}
        label={t("fields.description")}
        required
        error={errors.description?.message}
      />
      {failed && (
        <p role="alert" className={styles.error}>
          {t("errors.failed")}
        </p>
      )}
    </>
  );
}

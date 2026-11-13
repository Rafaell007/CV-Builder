import { useTranslations } from "next-intl";
import { Button } from "@/shared/components";
import type { UseCvDetailsFormResult } from "../../useCvDetailsForm";
import { CvFormFields } from "../CvFormFields";
import styles from "./CvDetailsForm.module.css";

export interface CvDetailsFormProps {
  /** The state of the details form (`useCvDetailsForm`): fields, `canUpdate`, submit and the general error. */
  details: UseCvDetailsFormResult;
}

/** The form of the Details tab: the CV fields with the UPDATE button below. The hook owns the rules and the request. */
export function CvDetailsForm({ details }: CvDetailsFormProps) {
  const t = useTranslations("cvs.details");
  const { canUpdate, isSubmitting, submit } = details;

  return (
    // noValidate: the rules and their messages come from the form hook, not from the browser bubbles.
    <form className={styles.form} noValidate onSubmit={(event) => void submit(event)}>
      <CvFormFields cvForm={details} />
      <div className={styles.actions}>
        {/* While sending, the button stays enabled (it shows the spinner), so keyboard focus is not lost. */}
        <Button type="submit" loading={isSubmitting} disabled={!canUpdate && !isSubmitting}>
          {t("update")}
        </Button>
      </div>
    </form>
  );
}

import { useTranslations } from "next-intl";
import { FormModal } from "@/shared/components";
import type { UseUpdateCvFormResult } from "../../useUpdateCvForm";
import { CvFormFields } from "../CvFormFields";

export interface UpdateCvModalProps {
  /** The state of the update flow: open state, form, submit and the general error. */
  update: UseUpdateCvFormResult;
}

/** The Update CV modal: the CV fields, filled with the current data, with UPDATE and CANCEL. */
export function UpdateCvModal({ update }: UpdateCvModalProps) {
  const t = useTranslations("cvs.update");
  const { form, isOpen, setOpen, submit } = update;
  const { isValid, isDirty, isSubmitting } = form.formState;

  return (
    <FormModal
      open={isOpen}
      onOpenChange={setOpen}
      title={t("title")}
      closeLabel={t("close")}
      submitLabel={t("submit")}
      cancelLabel={t("cancel")}
      canSubmit={isValid && isDirty}
      isSubmitting={isSubmitting}
      onSubmit={(event) => void submit(event)}
    >
      <CvFormFields cvForm={update} />
    </FormModal>
  );
}

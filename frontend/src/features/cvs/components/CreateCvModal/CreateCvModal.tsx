import { useTranslations } from "next-intl";
import { FormModal } from "@/shared/components";
import type { UseCreateCvFormResult } from "../../useCreateCvForm";
import { CvFormFields } from "../CvFormFields";

export interface CreateCvModalProps {
  /** The state of the create flow: open state, form, submit and the general error. */
  creation: UseCreateCvFormResult;
}

/** The Create CV modal: the CV fields with CREATE and CANCEL. */
export function CreateCvModal({ creation }: CreateCvModalProps) {
  const t = useTranslations("cvs.create");
  const { form, isOpen, setOpen, submit } = creation;
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
      <CvFormFields cvForm={creation} />
    </FormModal>
  );
}

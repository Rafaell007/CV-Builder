import { useTranslations } from "next-intl";
import { FormModal } from "@/shared/components";
import type { UseCreateProjectFormResult } from "../../useCreateProjectForm";
import { ProjectFormFields } from "../ProjectFormFields";

export interface CreateProjectModalProps {
  /** The state of the create flow: open state, form, submit and the general error. */
  creation: UseCreateProjectFormResult;
}

/** The Create project modal: the project fields with CREATE and CANCEL (page 27, Create Project). */
export function CreateProjectModal({ creation }: CreateProjectModalProps) {
  const t = useTranslations("projects.create");
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
      <ProjectFormFields projectForm={creation} />
    </FormModal>
  );
}

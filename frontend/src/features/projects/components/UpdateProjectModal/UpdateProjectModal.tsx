import { useTranslations } from "next-intl";
import { FormModal } from "@/shared/components";
import type { UseUpdateProjectFormResult } from "../../useUpdateProjectForm";
import { ProjectFormFields } from "../ProjectFormFields";

export interface UpdateProjectModalProps {
  /** The state of the update flow: open state, form, submit and the general error. */
  update: UseUpdateProjectFormResult;
}

/** The Update project modal: the project fields, filled with the current data, with UPDATE and CANCEL (page 27, Update Project). */
export function UpdateProjectModal({ update }: UpdateProjectModalProps) {
  const t = useTranslations("projects.update");
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
      <ProjectFormFields projectForm={update} />
    </FormModal>
  );
}

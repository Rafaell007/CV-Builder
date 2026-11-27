import { useTranslations } from "next-intl";
import { FormModal } from "@/shared/components";
import { CvProjectFormFields } from "../CvProjectFormFields";
import type { UseAddCvProjectResult } from "../useAddCvProject";

export interface AddCvProjectModalProps {
  /** The state of the add flow: open state, form, options, submit and the errors. */
  adding: UseAddCvProjectResult;
}

/** The Add project modal: the project fields and ADD and CANCEL. ADD waits until the form is valid (page 23, Add Project). */
export function AddCvProjectModal({ adding }: AddCvProjectModalProps) {
  const t = useTranslations("cvs.projects.add");
  const { form, isOpen, setOpen, submit } = adding;
  const { isValid, isSubmitting } = form.formState;

  return (
    <FormModal
      open={isOpen}
      onOpenChange={setOpen}
      title={t("title")}
      closeLabel={t("close")}
      submitLabel={t("submit")}
      cancelLabel={t("cancel")}
      canSubmit={isValid}
      isSubmitting={isSubmitting}
      onSubmit={(event) => void submit(event)}
    >
      <CvProjectFormFields
        form={form}
        error={adding.error}
        project={adding.project}
        projectChoice={{
          options: adding.options,
          loading: adding.optionsLoading,
          failed: adding.optionsFailed,
          onRetry: adding.retryProjects,
          onSelect: adding.selectProject,
        }}
        roles={{
          options: adding.roles,
          loading: adding.rolesLoading,
          failed: adding.rolesFailed,
          onRetry: adding.retryRoles,
        }}
      />
    </FormModal>
  );
}

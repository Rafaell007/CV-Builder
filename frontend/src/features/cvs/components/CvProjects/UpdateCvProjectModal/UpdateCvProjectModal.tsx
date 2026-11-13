import { useTranslations } from "next-intl";
import { FormModal } from "@/shared/components";
import { CvProjectFormFields } from "../CvProjectFormFields";
import type { UseUpdateCvProjectResult } from "../useUpdateCvProject";

export interface UpdateCvProjectModalProps {
  /** The state of the update flow: open state, form, roles, submit and the general error. */
  updating: UseUpdateCvProjectResult;
}

/** The Update project modal: the project fields, filled with the current data, and SAVE and CANCEL. SAVE waits for a change (page 23, Update Project). */
export function UpdateCvProjectModal({ updating }: UpdateCvProjectModalProps) {
  const t = useTranslations("cvs.projects.update");
  const { form, isOpen, setOpen, submit } = updating;
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
      <CvProjectFormFields
        form={form}
        error={updating.error}
        project={updating.project}
        roles={{
          options: updating.roles,
          loading: updating.rolesLoading,
          failed: updating.rolesFailed,
          onRetry: updating.retryRoles,
        }}
      />
    </FormModal>
  );
}

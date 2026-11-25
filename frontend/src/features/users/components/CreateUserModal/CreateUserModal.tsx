import { useTranslations } from "next-intl";
import { FormModal } from "@/shared/components";
import { useDepartmentOptions, usePositionOptions } from "@/shared/catalogOptions";
import type { UseCreateUserFormResult } from "../../useCreateUserForm";
import { UserFormFields } from "../UserFormFields";

export interface CreateUserModalProps {
  /** The state of the create flow: open state, form, submit and the general error. */
  creation: UseCreateUserFormResult;
}

/**
 * The Create user modal (users page, Create User modal): the user fields with CREATE and CANCEL, 860px wide on
 * desktop. The Department and Position options load each time it opens, so a catalog item added a minute ago is there.
 */
export function CreateUserModal({ creation }: CreateUserModalProps) {
  const t = useTranslations("users.create");
  const { form, isOpen, setOpen, submit } = creation;
  const { isValid, isDirty, isSubmitting } = form.formState;
  const departments = useDepartmentOptions(isOpen);
  const positions = usePositionOptions(isOpen);

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
      size="wide"
    >
      <UserFormFields
        userForm={creation}
        mode={{ kind: "create" }}
        departments={departments}
        positions={positions}
      />
    </FormModal>
  );
}

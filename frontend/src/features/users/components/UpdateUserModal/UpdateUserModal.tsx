import { useTranslations } from "next-intl";
import { FormModal } from "@/shared/components";
import { useDepartmentOptions } from "../../useDepartmentOptions";
import { usePositionOptions } from "../../usePositionOptions";
import type { UseUpdateUserFormResult } from "../../useUpdateUserForm";
import { UserFormFields } from "../UserFormFields";

export interface UpdateUserModalProps {
  /** The state of the update flow: the chosen user, open state, form, submit and the general error. */
  editing: UseUpdateUserFormResult;
  /** The signed-in admin. On their own row the Role field is disabled (D24). */
  currentUserId: string;
}

/**
 * The Update user modal (users page, Update User modal): the user fields filled with the current data, with UPDATE
 * and CANCEL, 860px wide on desktop. Email and Password are shown disabled. UPDATE is enabled only after a change.
 * The Department and Position options load each time it opens.
 */
export function UpdateUserModal({ editing, currentUserId }: UpdateUserModalProps) {
  const t = useTranslations("users.update");
  const { form, user, isOpen, setOpen, submit } = editing;
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
        userForm={editing}
        mode={{
          kind: "update",
          email: user?.email ?? "",
          ownAccount: user !== null && user.id === currentUserId,
        }}
        departments={departments}
        positions={positions}
      />
    </FormModal>
  );
}

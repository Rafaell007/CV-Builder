"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState, type BaseSyntheticEvent } from "react";
import { useToast } from "@/shared/components";
import { DEFAULT_USER_ROLE, MAX_NAME_LENGTH } from "../users.constants";
import type { UserFormSubmit, UserFormValues, UserListItem } from "../users.types";
import { useUpdateUser } from "../useUpdateUser";
import { useUserForm } from "../useUserForm";
import {
  getUserDisplayName,
  toUpdateUserInput,
  toUserFormValues,
  updateUserFormSchema,
} from "../utils";

// The form needs values before a user is chosen; `open` replaces them with the data of the user.
const EMPTY_VALUES: UserFormValues = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  departmentId: "",
  positionId: "",
  role: DEFAULT_USER_ROLE,
};

// Every field of `UpdateUserInput` but the id; each one can show a server error inline.
const SERVER_FIELDS = ["firstName", "lastName", "departmentId", "positionId", "role"] as const;

/**
 * The Update user flow (users page, Update User modal): the user that is being edited, the open state of the modal
 * and the request. The form is `useUserForm`. `open(user)` fills it with the current data of that user; Email and
 * Password are shown disabled and never sent. A failed request keeps every typed value and shows the error inside the
 * modal; only a successful request closes it.
 */
export function useUpdateUserForm() {
  const t = useTranslations("users");
  const toast = useToast();
  const { update } = useUpdateUser();
  const schema = useMemo(
    () =>
      updateUserFormSchema({
        firstNameRequired: t("form.errors.firstNameRequired"),
        firstNameTooLong: t("form.errors.firstNameTooLong", { max: MAX_NAME_LENGTH }),
        lastNameRequired: t("form.errors.lastNameRequired"),
        lastNameTooLong: t("form.errors.lastNameTooLong", { max: MAX_NAME_LENGTH }),
        departmentRequired: t("form.errors.departmentRequired"),
        positionRequired: t("form.errors.positionRequired"),
        roleRequired: t("form.errors.roleRequired"),
      }),
    [t],
  );
  const {
    form,
    generalError,
    reset,
    showError,
    submit: submitForm,
  } = useUserForm({
    schema,
    defaultValues: EMPTY_VALUES,
    serverFields: SERVER_FIELDS,
  });
  // The user stays set while the modal fades out, so the request still has its id and the fields their email.
  const [user, setUser] = useState<UserListItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  function open(chosen: UserListItem) {
    reset(toUserFormValues(chosen));
    setUser(chosen);
    setIsOpen(true);
  }

  async function send(values: UserFormSubmit) {
    if (!user) return;
    try {
      const saved = await update(toUpdateUserInput(user, values));
      setIsOpen(false);
      toast.success({
        title: t("update.success.title"),
        description: t("update.success.text", { name: getUserDisplayName(saved) }),
      });
    } catch (error) {
      // Nothing resets the form here, so the values stay.
      showError(error);
    }
  }

  function submit(event: BaseSyntheticEvent) {
    return submitForm(event, send);
  }

  return { form, user, isOpen, open, setOpen: setIsOpen, submit, generalError };
}

export type UseUpdateUserFormResult = ReturnType<typeof useUpdateUserForm>;

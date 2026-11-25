"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState, type BaseSyntheticEvent } from "react";
import { useToast } from "@/shared/components";
import { getUserDisplayName, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/shared/utils";
import { DEFAULT_USER_ROLE, MAX_NAME_LENGTH } from "../users.constants";
import type { UserFormSubmit, UserFormValues } from "../users.types";
import { useCreateUser } from "../useCreateUser";
import { useUserForm } from "../useUserForm";
import { createUserFormSchema, toCreateUserInput } from "../utils";

const EMPTY_VALUES: UserFormValues = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  departmentId: "",
  positionId: "",
  role: DEFAULT_USER_ROLE,
};

// Every field of `CreateUserInput`; each one can show a server error inline.
const SERVER_FIELDS = [
  "email",
  "password",
  "firstName",
  "lastName",
  "departmentId",
  "positionId",
  "role",
] as const;

/**
 * The Create user flow (users page, Create User modal): the open state of the modal and the request. The form is
 * `useUserForm`. It is empty each time the modal opens, with Role set to Employee. A failed request keeps every typed
 * value and shows the error inside the modal; only a successful request closes it.
 */
export function useCreateUserForm() {
  const t = useTranslations("users");
  const toast = useToast();
  const { create } = useCreateUser();
  const schema = useMemo(
    () =>
      createUserFormSchema({
        emailRequired: t("form.errors.emailRequired"),
        emailInvalid: t("form.errors.emailInvalid"),
        passwordRequired: t("form.errors.passwordRequired"),
        passwordTooShort: t("form.errors.passwordTooShort", { min: PASSWORD_MIN_LENGTH }),
        passwordTooLong: t("form.errors.passwordTooLong", { max: PASSWORD_MAX_LENGTH }),
        passwordWeak: t("form.errors.passwordWeak"),
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
  const [isOpen, setIsOpen] = useState(false);

  function open() {
    reset(EMPTY_VALUES);
    setIsOpen(true);
  }

  async function send(values: UserFormSubmit) {
    try {
      const user = await create(toCreateUserInput(values));
      setIsOpen(false);
      toast.success({
        title: t("create.success.title"),
        description: t("create.success.text", { name: getUserDisplayName(user) }),
      });
    } catch (error) {
      // Nothing resets the form here, so the values stay.
      showError(error);
    }
  }

  function submit(event: BaseSyntheticEvent) {
    return submitForm(event, send);
  }

  return { form, isOpen, open, setOpen: setIsOpen, submit, generalError };
}

export type UseCreateUserFormResult = ReturnType<typeof useCreateUserForm>;

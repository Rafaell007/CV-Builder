"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState, type BaseSyntheticEvent } from "react";
import { useWatch } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/shared/components";
import { useServerForm } from "@/shared/forms";
import { USER_NAME_MAX_LENGTH, userProfileRules } from "@/shared/userProfile";
import { getUserDisplayName } from "@/shared/utils";
import type { ProfileFormValues, ProfileUser } from "../../user-details.types";
import { useUpdateProfile } from "../../useUpdateProfile";
import {
  hasProfileChanged,
  toProfileFormValues,
  toProfileGeneralError,
  toUpdateProfileInput,
} from "../../utils";

// Every field of `UpdateProfileInput` but the id; each one can show a server error inline.
const SERVER_FIELDS = ["firstName", "lastName", "departmentId", "positionId"] as const;

/**
 * The form of the Profile tab: First Name, Last Name, Department and Position with the shared profile rules (all
 * required, names at most 100 characters), filled with the user's current values. The backend checks them again.
 * `initialValues` go to the inputs as `defaultValue` too: `register` fills an input only in the browser, so without it
 * the server HTML would show empty names until hydration (PLAN D6).
 *
 * `submit` saves with `updateProfile`. A success shows a toast and makes the saved values the new "unchanged" state. A
 * failure keeps every typed value: a field error shows under its field, anything else as `generalError`.
 */
export function useProfileForm(user: ProfileUser) {
  const t = useTranslations("userDetails.profile.form");
  const toast = useToast();
  const { update, pending } = useUpdateProfile();

  const schema = useMemo(
    () =>
      z.object(
        userProfileRules({
          firstNameRequired: t("errors.firstNameRequired"),
          firstNameTooLong: t("errors.firstNameTooLong", { max: USER_NAME_MAX_LENGTH }),
          lastNameRequired: t("errors.lastNameRequired"),
          lastNameTooLong: t("errors.lastNameTooLong", { max: USER_NAME_MAX_LENGTH }),
          departmentRequired: t("errors.departmentRequired"),
          positionRequired: t("errors.positionRequired"),
        }),
      ),
    [t],
  );

  const initialValues = toProfileFormValues(user);
  // The last saved values: the "unchanged" state for UPDATE. Set from the answer of a save, so it does not depend on
  // when the cached user re-renders this form.
  const [savedValues, setSavedValues] = useState(initialValues);
  const {
    form,
    generalError,
    reset,
    showError,
    submit: submitForm,
  } = useServerForm<
    ProfileFormValues,
    ProfileFormValues,
    "forbidden" | "notFound" | "concurrentChange"
  >(schema, {
    defaultValues: initialValues,
    serverFields: { fields: SERVER_FIELDS, getMessage: () => t("errors.serverInvalid") },
    // Field errors show under their fields; anything they cannot show (and every other failure) is the general error.
    placeFailure: (failure) =>
      failure.kind === "invalid"
        ? { show: "fieldErrors", otherwise: toProfileGeneralError(failure) }
        : { show: "general", error: toProfileGeneralError(failure) },
  });

  const [firstName, lastName, departmentId, positionId] = useWatch({
    control: form.control,
    name: SERVER_FIELDS,
  });
  const hasChanged = hasProfileChanged(
    { firstName, lastName, departmentId, positionId },
    savedValues,
  );

  async function save(values: ProfileFormValues) {
    try {
      const saved = await update(toUpdateProfileInput(user.id, values));
      // The saved (trimmed) values become the "unchanged" state, so UPDATE is disabled again.
      const savedFormValues = toProfileFormValues(saved);
      reset(savedFormValues);
      setSavedValues(savedFormValues);
      toast.success({
        title: t("success.title"),
        description: t("success.text", { name: getUserDisplayName(saved) }),
      });
    } catch (error) {
      // Nothing resets the form here, so the typed values stay.
      showError(error);
    }
  }

  /** Validates, then saves the checked values. A second submit during the request is ignored. */
  function submit(event?: BaseSyntheticEvent) {
    return submitForm(event, save);
  }

  return { form, initialValues, hasChanged, pending, generalError, submit };
}

export type UseProfileFormResult = ReturnType<typeof useProfileForm>;

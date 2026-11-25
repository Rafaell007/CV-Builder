"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { z } from "zod";
import { useZodForm } from "@/shared/forms";
import { USER_NAME_MAX_LENGTH, userProfileRules } from "@/shared/userProfile";
import type { ProfileFormValues, ProfileUser } from "../../user-details.types";
import { toProfileFormValues } from "../../utils";

/**
 * The form of the Profile tab: First Name, Last Name, Department and Position with the shared profile rules (all
 * required, names at most 100 characters), filled with the user's current values. The backend checks them again.
 * `initialValues` go to the inputs as `defaultValue` too: `register` fills an input only in the browser, so without it
 * the server HTML would show empty names until hydration (PLAN D6).
 */
export function useProfileForm(user: ProfileUser) {
  const t = useTranslations("userDetails.profile.form.errors");
  const schema = useMemo(
    () =>
      z.object(
        userProfileRules({
          firstNameRequired: t("firstNameRequired"),
          firstNameTooLong: t("firstNameTooLong", { max: USER_NAME_MAX_LENGTH }),
          lastNameRequired: t("lastNameRequired"),
          lastNameTooLong: t("lastNameTooLong", { max: USER_NAME_MAX_LENGTH }),
          departmentRequired: t("departmentRequired"),
          positionRequired: t("positionRequired"),
        }),
      ),
    [t],
  );

  const initialValues = toProfileFormValues(user);
  const form = useZodForm<ProfileFormValues, ProfileFormValues>(schema, {
    defaultValues: initialValues,
  });
  return { form, initialValues };
}

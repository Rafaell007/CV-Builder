"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useServerForm } from "@/shared/forms";
import type { CvProjectFormSubmit, CvProjectFormValues, ProjectRange } from "../cvProjects.types";
import {
  cvProjectFormSchema,
  EMPTY_CV_PROJECT_FORM_VALUES,
  toCvProjectDateText,
  type CvProjectDateTexts,
} from "../utils";

// The fields the backend validates (`AddCvProjectInput`, `UpdateCvProjectInput`); each one can show a server error inline.
const SERVER_FIELDS = ["projectId", "startDate", "endDate", "roleIds", "responsibilities"] as const;

// The kinds with their own text. Every other kind of `readFailure` shows the general `failed` text.
const OWN_TEXT_KINDS = ["notFound", "forbidden", "conflict", "invalid"] as const;

type OwnTextKind = (typeof OWN_TEXT_KINDS)[number];

/**
 * The form that Add project and Update project share (page 23: "Validation rules are identical to Add Project"):
 * the fields with their rules and the mapping of a failed request. The guard against a double submit is in
 * `useServerForm`.
 * A failed request keeps every typed value: `BAD_USER_INPUT` field errors show under their field, anything else
 * becomes one general message (`error`). `rangeOf` gives the days of a project; it must stay the same function
 * until the catalog changes, because a new function builds the rules again.
 */
export function useCvProjectForm(rangeOf: (projectId: string) => ProjectRange | undefined) {
  const t = useTranslations("cvs.projects.form.errors");

  // One text for each code of the date rule: the form rules and the answer of the backend show the same texts.
  const dateTexts = useMemo<CvProjectDateTexts>(
    () => ({
      START_OUTSIDE_PROJECT: t("startDateOutOfRange"),
      END_OUTSIDE_PROJECT: t("endDateOutOfRange"),
      END_BEFORE_START: t("endDateBeforeStart"),
    }),
    [t],
  );

  const schema = useMemo(
    () =>
      cvProjectFormSchema(
        {
          projectRequired: t("projectRequired"),
          startDateRequired: t("startDateRequired"),
          dateTexts,
          rolesRequired: t("rolesRequired"),
          rolesTooMany: t("rolesTooMany"),
          responsibilitiesTooLong: t("responsibilitiesTooLong"),
        },
        rangeOf,
      ),
    [t, dateTexts, rangeOf],
  );
  const { form, generalError, reset, showError, submit } = useServerForm<
    CvProjectFormValues,
    CvProjectFormSubmit,
    OwnTextKind
  >(schema, {
    defaultValues: EMPTY_CV_PROJECT_FORM_VALUES,
    serverFields: {
      fields: SERVER_FIELDS,
      getMessage: (field, reasons) => {
        switch (field) {
          case "projectId":
            return t("server.projectId");
          case "startDate":
            return toCvProjectDateText(reasons, dateTexts) ?? t("server.startDate");
          case "endDate":
            return toCvProjectDateText(reasons, dateTexts) ?? t("server.endDate");
          case "roleIds":
            return t("server.roleIds");
          default:
            return t("server.responsibilities");
        }
      },
    },
    // Field errors first; when they do not all show, the kind with its own text, else `failed`.
    placeFailure: ({ kind }) => ({
      show: "fieldErrors",
      otherwise: OWN_TEXT_KINDS.find((item) => item === kind) ?? "failed",
    }),
  });

  return {
    form,
    error: generalError === null ? undefined : t(generalError),
    reset,
    showError,
    submit,
  };
}

export type UseCvProjectFormResult = ReturnType<typeof useCvProjectForm>;

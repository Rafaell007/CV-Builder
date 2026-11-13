import { useLocale, useTranslations } from "next-intl";
import { Controller } from "react-hook-form";
import {
  Button,
  DatePicker,
  MultiSelect,
  Textarea,
  TextField,
  type DatePickerLabels,
} from "@/shared/components";
import { useEnvironmentOptions } from "../../useEnvironmentOptions";
import type { UseProjectFormResult } from "../../useProjectForm";
import styles from "./ProjectFormFields.module.css";

export interface ProjectFormFieldsProps {
  /** The form of the modal (`useProjectForm`): the fields, their errors and the general error. */
  projectForm: Pick<UseProjectFormResult, "form" | "failed">;
}

/**
 * The fields of a project form (name, domain, two dates, description and the Environment multi-select) and its
 * general error message (page 27, Create Project and Update Project). It renders only the fields: the modal
 * around it owns the title, the buttons and the submit. The technologies come from the skills catalog
 * (`useEnvironmentOptions`): while they load the field is disabled, and when they fail it shows an error and a retry.
 */
export function ProjectFormFields({ projectForm }: ProjectFormFieldsProps) {
  const t = useTranslations("projects.form");
  const locale = useLocale();
  const { form, failed } = projectForm;
  const { register, control, getValues, trigger } = form;
  const { errors } = form.formState;
  const environment = useEnvironmentOptions();

  const dateLabels: DatePickerLabels = {
    calendar: t("datePicker.calendar"),
    previousMonth: t("datePicker.previousMonth"),
    nextMonth: t("datePicker.nextMonth"),
    previousYear: t("datePicker.previousYear"),
    nextYear: t("datePicker.nextYear"),
    chooseDayPrefix: t("datePicker.chooseDayPrefix"),
    unavailableDayPrefix: t("datePicker.unavailableDayPrefix"),
    monthPrefix: t("datePicker.monthPrefix"),
  };

  return (
    <>
      <TextField
        {...register("name")}
        label={t("fields.name")}
        required
        error={errors.name?.message}
      />
      <TextField
        {...register("domain")}
        label={t("fields.domain")}
        required
        error={errors.domain?.message}
      />
      <div className={styles.dates}>
        <Controller
          control={control}
          name="startDate"
          render={({ field }) => (
            <DatePicker
              ref={field.ref}
              name={field.name}
              label={t("fields.startDate")}
              value={field.value}
              onValueChange={(date) => {
                field.onChange(date);
                // The end date was valid against the old start date: check it again, once the user has filled it.
                if (getValues("endDate") !== null) void trigger("endDate");
              }}
              onBlur={field.onBlur}
              locale={locale}
              labels={dateLabels}
              required
              error={errors.startDate?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="endDate"
          render={({ field }) => (
            <DatePicker
              ref={field.ref}
              name={field.name}
              label={t("fields.endDate")}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              locale={locale}
              labels={dateLabels}
              required
              error={errors.endDate?.message}
            />
          )}
        />
      </div>
      <Textarea
        {...register("description")}
        label={t("fields.description")}
        required
        error={errors.description?.message}
      />
      <Controller
        control={control}
        name="environmentIds"
        render={({ field }) => (
          <div className={styles.environment}>
            <MultiSelect
              ref={field.ref}
              label={t("fields.environment")}
              options={environment.options}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              getRemoveLabel={(option) => t("environment.remove", { option })}
              disabled={environment.loading}
              helperText={environment.loading ? t("environment.loading") : undefined}
              error={environment.failed ? t("environment.failed") : errors.environmentIds?.message}
            />
            {environment.failed && (
              <Button variant="secondary" onClick={environment.retry}>
                {t("environment.retry")}
              </Button>
            )}
          </div>
        )}
      />
      {failed && (
        <p role="alert" className={styles.error}>
          {t("errors.failed")}
        </p>
      )}
    </>
  );
}

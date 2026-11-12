import { useLocale, useTranslations } from "next-intl";
import { Controller } from "react-hook-form";
import { DatePicker, Textarea, TextField, type DatePickerLabels } from "@/shared/components";
import type { UseProjectFormResult } from "../../useProjectForm";
import styles from "./ProjectFormFields.module.css";

export interface ProjectFormFieldsProps {
  /** The form of the modal (`useProjectForm`): the fields, their errors and the general error. */
  projectForm: Pick<UseProjectFormResult, "form" | "failed">;
}

/**
 * The five fields of a project form and its general error message (page 27, Create Project and Update
 * Project). It renders only the fields: the modal around it owns the title, the buttons and the submit.
 */
export function ProjectFormFields({ projectForm }: ProjectFormFieldsProps) {
  const t = useTranslations("projects.form");
  const locale = useLocale();
  const { form, failed } = projectForm;
  const { register, control, getValues, trigger } = form;
  const { errors } = form.formState;

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
      {failed && (
        <p role="alert" className={styles.error}>
          {t("errors.failed")}
        </p>
      )}
    </>
  );
}

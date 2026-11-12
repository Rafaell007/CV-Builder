import { useLocale, useTranslations } from "next-intl";
import { Controller } from "react-hook-form";
import {
  DatePicker,
  FormModal,
  Textarea,
  TextField,
  type DatePickerLabels,
} from "@/shared/components";
import type { UseCreateProjectFormResult } from "../../useCreateProjectForm";
import styles from "./CreateProjectModal.module.css";

export interface CreateProjectModalProps {
  /** The state of the create flow: open state, form, submit and the general error. */
  creation: UseCreateProjectFormResult;
}

/** The Create project modal: Name, Domain, Start Date, End Date and Description, with CREATE and CANCEL (page 27, Create Project). */
export function CreateProjectModal({ creation }: CreateProjectModalProps) {
  const t = useTranslations("projects.create");
  const locale = useLocale();
  const { form, isOpen, setOpen, submit, failed } = creation;
  const { register, control, getValues, trigger } = form;
  const { errors, isValid, isDirty, isSubmitting } = form.formState;

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
    </FormModal>
  );
}

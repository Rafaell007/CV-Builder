import { useLocale, useTranslations } from "next-intl";
import { Controller } from "react-hook-form";
import {
  Button,
  DatePicker,
  MultiSelect,
  Select,
  Textarea,
  TextField,
  type DatePickerLabels,
} from "@/shared/components";
import type { CatalogProject, ProjectRoleItem } from "../cvProjects.types";
import type { UseCvProjectFormResult } from "../useCvProjectForm";
import { toProjectRange } from "../utils";
import styles from "./CvProjectFormFields.module.css";

/** Where the options of a field come from, and whether they loaded. */
interface OptionsState {
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
}

export interface CvProjectFormFieldsProps {
  /** The form of the modal (`useCvProjectForm`): the fields and their errors. */
  form: UseCvProjectFormResult["form"];
  /** The general error of a failed request (the field errors show under their fields). */
  error: string | undefined;
  /** The project that is chosen. Its Domain, Description, Environment and days are shown in the read-only fields. */
  project: CatalogProject | undefined;
  /**
   * Add project: the projects to choose from. Without it (Update project) the Project field is disabled and shows
   * `project`: the project of an entry cannot change.
   */
  projectChoice?: OptionsState & {
    options: readonly CatalogProject[] | undefined;
    onSelect: (projectId: string) => void;
  };
  roles: OptionsState & { options: readonly ProjectRoleItem[] | undefined };
}

/**
 * The fields of a CV project form (Project, Domain, Start Date, End Date, Description, Environment, Roles and
 * Responsibilities) and its general error message (page 23, Add Project and Update Project). Domain, Description and
 * Environment belong to the catalog project: they are disabled and are never part of the form values. It renders
 * only the fields: the modal around it owns the title, the buttons and the submit. The dates stay inside the days
 * of the project (the date picker blocks other days; the form rules say it as text).
 */
export function CvProjectFormFields({
  form,
  error,
  project,
  projectChoice,
  roles,
}: CvProjectFormFieldsProps) {
  const t = useTranslations("cvs.projects.form");
  const locale = useLocale();
  const { register, control, getValues, trigger } = form;
  const { errors } = form.formState;
  const range = project === undefined ? undefined : toProjectRange(project);

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

  const projectOptions = (projectChoice?.options ?? (project ? [project] : [])).map((item) => ({
    value: item.id,
    label: item.name,
  }));
  // Without options there is nothing to choose: say why, so the empty field does not look broken.
  const noneLeft = projectChoice?.options !== undefined && projectChoice.options.length === 0;
  const environment = (project?.environment ?? []).map((skill) => ({
    value: skill.id,
    label: skill.name,
  }));
  const roleOptions = (roles.options ?? []).map((role) => ({ value: role.id, label: role.name }));
  // The days only make sense inside a project: the pickers wait for the choice.
  const datesDisabled = project === undefined;

  return (
    <div className={styles.fields}>
      <Controller
        control={control}
        name="projectId"
        render={({ field }) => (
          <Select
            ref={field.ref}
            name={field.name}
            label={t("fields.project")}
            options={projectOptions}
            value={field.value}
            onValueChange={(id) => projectChoice?.onSelect(id)}
            onBlur={field.onBlur}
            disabled={
              projectChoice === undefined ||
              projectChoice.loading ||
              projectChoice.failed ||
              noneLeft
            }
            required
            error={errors.projectId?.message}
          />
        )}
      />
      {projectChoice?.loading && (
        <p role="status" className={styles.status}>
          {t("projectOptions.loading")}
        </p>
      )}
      {projectChoice?.failed && !projectChoice.loading && (
        <p role="alert" className={styles.error}>
          {t("projectOptions.failed")}
          <button type="button" className={styles.retry} onClick={projectChoice.onRetry}>
            {t("projectOptions.retry")}
          </button>
        </p>
      )}
      {noneLeft && !projectChoice?.loading && (
        <p role="status" className={styles.status}>
          {t("projectOptions.none")}
        </p>
      )}
      <TextField
        label={t("fields.domain")}
        value={project?.domain ?? ""}
        readOnly
        disabled
        required
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
              minDate={range?.start}
              maxDate={range?.end}
              disabled={datesDisabled}
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
              minDate={range?.start}
              maxDate={range?.end}
              disabled={datesDisabled}
              error={errors.endDate?.message}
            />
          )}
        />
      </div>
      <Textarea
        label={t("fields.description")}
        value={project?.description ?? ""}
        readOnly
        disabled
        required
      />
      <MultiSelect
        label={t("fields.environment")}
        options={environment}
        value={environment.map((option) => option.value)}
        onValueChange={() => undefined}
        getRemoveLabel={(option) => t("environment.remove", { option })}
        disabled
      />
      <Controller
        control={control}
        name="roleIds"
        render={({ field }) => (
          <div className={styles.roles}>
            <MultiSelect
              ref={field.ref}
              label={t("fields.roles")}
              options={roleOptions}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              getRemoveLabel={(option) => t("roles.remove", { option })}
              disabled={roles.loading}
              helperText={roles.loading ? t("roles.loading") : undefined}
              error={roles.failed ? t("roles.failed") : errors.roleIds?.message}
            />
            {roles.failed && (
              <Button variant="secondary" onClick={roles.onRetry}>
                {t("roles.retry")}
              </Button>
            )}
          </div>
        )}
      />
      <Textarea
        {...register("responsibilities")}
        label={t("fields.responsibilities")}
        error={errors.responsibilities?.message}
      />
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}

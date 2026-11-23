import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";
import { Button, FormErrorMessage, FormModal, Select, TextField } from "@/shared/components";
import type { UseCreateSkillFormResult } from "../useCreateSkillForm";
import type { UseSkillCategoriesResult } from "../useSkillCategories";
import { categoryOptions, type CurrentSkillCategory } from "../utils";
import styles from "./SkillFormModal.module.css";

export interface SkillFormModalProps {
  /** Create shows "Create skill" with CREATE; Update shows "Update skill" with UPDATE. */
  kind: "create" | "update";
  /** The state of the flow (`useCreateSkillForm` or `useUpdateSkillForm`: both have this shape). */
  skillForm: Pick<
    UseCreateSkillFormResult,
    "form" | "failed" | "hasChanged" | "isOpen" | "setOpen" | "submit"
  >;
  /** The options of the Category field (`useSkillCategories`). */
  categories: UseSkillCategoriesResult;
  /** Update only: the category the skill has now, so the field shows it even before the categories load. */
  currentCategory?: CurrentSkillCategory | undefined;
}

/**
 * The Create or Update skill modal: the Name field and the Category select with their errors, and the submit and
 * CANCEL buttons. The Category field is disabled while the categories load; when they fail it says so with Retry.
 */
export function SkillFormModal({
  kind,
  skillForm,
  categories,
  currentCategory,
}: SkillFormModalProps) {
  const t = useTranslations("catalogs.skills");
  const { form, failed, hasChanged, isOpen, setOpen, submit } = skillForm;
  const { isValid, isSubmitting, errors } = form.formState;
  const categoriesFailed = categories.failed && !categories.loading;
  const options = categoryOptions(categories.categories, currentCategory);

  return (
    <FormModal
      open={isOpen}
      onOpenChange={setOpen}
      title={t(`${kind}.title`)}
      closeLabel={t(`${kind}.close`)}
      submitLabel={t(`${kind}.submit`)}
      cancelLabel={t(`${kind}.cancel`)}
      canSubmit={isValid && hasChanged}
      isSubmitting={isSubmitting}
      onSubmit={(event) => void submit(event)}
    >
      <TextField
        {...form.register("name")}
        label={t("form.fields.name")}
        required
        error={errors.name?.message}
      />
      <Controller
        control={form.control}
        name="categoryId"
        render={({ field }) => (
          <Select
            ref={field.ref}
            name={field.name}
            label={t("form.fields.category")}
            options={options}
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={categories.loading || categoriesFailed}
            required
            error={errors.categoryId?.message}
          />
        )}
      />
      {categoriesFailed && (
        <div className={styles.categoriesFailed}>
          <FormErrorMessage>{t("form.errors.categoriesFailed")}</FormErrorMessage>
          <Button variant="text" onClick={categories.retry}>
            {t("form.errors.categoriesRetry")}
          </Button>
        </div>
      )}
      {failed && <FormErrorMessage>{t("form.errors.failed")}</FormErrorMessage>}
    </FormModal>
  );
}

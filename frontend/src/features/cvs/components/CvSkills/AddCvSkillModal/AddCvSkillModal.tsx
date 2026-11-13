import { useTranslations } from "next-intl";
import { FormModal, Select } from "@/shared/components";
import type { UseAddCvSkillResult } from "../useAddCvSkill";
import styles from "./AddCvSkillModal.module.css";

export interface AddCvSkillModalProps {
  /** The state of the add flow: open state, options, chosen skill, submit and the errors. */
  adding: UseAddCvSkillResult;
}

/** The Add skill modal: one Skill field with the skills of the CV owner, ADD and CANCEL (page 22, Add Skill). */
export function AddCvSkillModal({ adding }: AddCvSkillModalProps) {
  const t = useTranslations("cvs.skills.add");
  const {
    isOpen,
    setOpen,
    skillId,
    select,
    submit,
    pending,
    options,
    optionsLoading,
    optionsFailed,
    retryOptions,
    fieldError,
    generalError,
  } = adding;
  const choices = (options ?? []).map((option) => ({ value: option.id, label: option.name }));
  // Without options there is nothing to choose: say why, so the empty field does not look broken.
  const noneLeft = options !== undefined && options.length === 0;

  return (
    <FormModal
      open={isOpen}
      onOpenChange={setOpen}
      title={t("title")}
      closeLabel={t("close")}
      submitLabel={t("submit")}
      cancelLabel={t("cancel")}
      canSubmit={skillId !== ""}
      isSubmitting={pending}
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <Select
        label={t("skill")}
        options={choices}
        value={skillId}
        onValueChange={select}
        disabled={optionsLoading || optionsFailed || noneLeft}
        error={fieldError}
        required
      />
      {optionsLoading && (
        <p role="status" className={styles.status}>
          {t("loading")}
        </p>
      )}
      {optionsFailed && !optionsLoading && (
        <p role="alert" className={styles.error}>
          {t("loadFailed")}
          <button type="button" className={styles.retry} onClick={retryOptions}>
            {t("retry")}
          </button>
        </p>
      )}
      {noneLeft && !optionsLoading && (
        <p role="status" className={styles.status}>
          {t("none")}
        </p>
      )}
      {generalError && (
        <p role="alert" className={styles.error}>
          {generalError}
        </p>
      )}
    </FormModal>
  );
}

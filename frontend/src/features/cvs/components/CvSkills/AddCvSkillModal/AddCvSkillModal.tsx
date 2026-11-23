import { useTranslations } from "next-intl";
import { FormModal, Select } from "@/shared/components";
import { MASTERY_LEVELS, NO_MASTERY } from "../cvSkills.constants";
import type { UseAddCvSkillResult } from "../useAddCvSkill";
import { useMasteryLabel } from "../useMasteryLabel";
import styles from "./AddCvSkillModal.module.css";

export interface AddCvSkillModalProps {
  /** The state of the add flow: open state, options, chosen skill, submit and the errors. */
  adding: UseAddCvSkillResult;
}

/**
 * The Add skill modal: the Skill field with the skills of the CV owner, the optional Skill mastery field, ADD and
 * CANCEL. The doc of page 22 lists only Skill, but Figma shows the mastery and Figma wins (agreed with Rafal).
 */
export function AddCvSkillModal({ adding }: AddCvSkillModalProps) {
  const t = useTranslations("cvs.skills.add");
  const masteryLabel = useMasteryLabel();
  const {
    isOpen,
    setOpen,
    skillId,
    select,
    mastery,
    selectMastery,
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
      // The Skill field is disabled while its options load, so the focus stays on the form: no field looks focused.
      initialFocus="form"
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
      <Select
        label={t("mastery")}
        options={[
          { value: NO_MASTERY, label: t("noMastery") },
          ...MASTERY_LEVELS.map(({ level }) => ({ value: level, label: masteryLabel(level) })),
        ]}
        value={mastery}
        onValueChange={(value) => {
          if (value === NO_MASTERY) {
            selectMastery(NO_MASTERY);
            return;
          }
          const next = MASTERY_LEVELS.find(({ level }) => level === value);
          if (next) selectMastery(next.level);
        }}
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

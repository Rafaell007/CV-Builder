import { useTranslations } from "next-intl";
import { FormModal, Select } from "@/shared/components";
import { MASTERY_LEVELS, NO_MASTERY } from "../cvSkills.constants";
import type { UseUpdateCvSkillResult } from "../useUpdateCvSkill";
import { useMasteryLabel } from "../useMasteryLabel";
import styles from "./UpdateCvSkillModal.module.css";

export interface UpdateCvSkillModalProps {
  /** The state of the update flow: open state, the skill, the chosen mastery, submit and the error. */
  updating: UseUpdateCvSkillResult;
}

/**
 * The Update skill modal (page 22, Update Skill). The Skill field shows the current skill and is disabled: the
 * requirements do not let a skill change. The mastery is the one value the user can change, so SAVE is enabled only
 * when it differs from the saved one.
 */
export function UpdateCvSkillModal({ updating }: UpdateCvSkillModalProps) {
  const t = useTranslations("cvs.skills.update");
  const masteryLabel = useMasteryLabel();
  const { isOpen, setOpen, skill, mastery, select, submit, canSave, pending, error } = updating;

  return (
    <FormModal
      open={isOpen}
      onOpenChange={setOpen}
      title={t("title")}
      closeLabel={t("close")}
      submitLabel={t("submit")}
      cancelLabel={t("cancel")}
      canSubmit={canSave}
      isSubmitting={pending}
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <Select
        label={t("skill")}
        options={skill ? [{ value: skill.skillId, label: skill.name }] : []}
        value={skill?.skillId ?? ""}
        onValueChange={() => undefined}
        disabled
        required
      />
      <Select
        label={t("mastery")}
        options={[NO_MASTERY, ...MASTERY_LEVELS.map(({ level }) => level)].map((level) => ({
          value: level,
          label: masteryLabel(level),
        }))}
        value={mastery}
        onValueChange={(value) => {
          if (value === NO_MASTERY) {
            select(NO_MASTERY);
            return;
          }
          const next = MASTERY_LEVELS.find(({ level }) => level === value);
          if (next) select(next.level);
        }}
        required
      />
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </FormModal>
  );
}

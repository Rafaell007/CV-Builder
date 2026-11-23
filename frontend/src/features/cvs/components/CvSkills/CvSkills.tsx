"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  AddIcon,
  Button,
  DeleteForeverIcon,
  PageState,
  SelectionToolbar,
  type PageStateLabels,
} from "@/shared/components";
import { AddCvSkillModal } from "./AddCvSkillModal";
import styles from "./CvSkills.module.css";
import { RemoveCvSkillsModal } from "./RemoveCvSkillsModal";
import { SkillGroups } from "./SkillGroups";
import { UpdateCvSkillModal } from "./UpdateCvSkillModal";
import { useAddCvSkill } from "./useAddCvSkill";
import { useCvSkills } from "./useCvSkills";
import { useRemoveCvSkills } from "./useRemoveCvSkills";
import { useUpdateCvSkill } from "./useUpdateCvSkill";
import { groupSkillsByCategory } from "./utils";

export interface CvSkillsProps {
  cvId: string;
}

/**
 * The content of the Skills tab (PLAN S7.3, KAN-114): the skills of the CV grouped by category, ADD SKILL,
 * REMOVE SKILLS and the click on a skill to change its mastery. All data comes from the backend, which also decides
 * who may change the CV: `CvLayout` shows this page only after the backend returned the CV.
 */
export function CvSkills({ cvId }: CvSkillsProps) {
  const t = useTranslations("cvs.skills");
  const { skills, loading, failed, retry } = useCvSkills(cvId);
  const adding = useAddCvSkill(cvId);
  const updating = useUpdateCvSkill();
  const removal = useRemoveCvSkills(cvId);
  const groups = useMemo(() => groupSkillsByCategory(skills ?? []), [skills]);

  const labels: PageStateLabels = {
    loading: t("states.loading"),
    empty: t("states.empty"),
    noResults: t("states.empty"),
    error: t("states.error"),
    retry: t("states.retry"),
  };
  const busy = adding.pending || updating.pending || removal.pending;

  return (
    <div className={styles.page}>
      {skills === undefined ? (
        <div className={styles.state}>
          {failed && !loading ? (
            <PageState kind="error" labels={labels} onRetry={retry} />
          ) : (
            <PageState kind="loading" labels={labels} rows={3} />
          )}
        </div>
      ) : skills.length === 0 ? (
        <div className={styles.state}>
          <PageState kind="empty" labels={labels} />
        </div>
      ) : (
        <SkillGroups
          groups={groups}
          selecting={removal.selecting}
          selectedIds={removal.selectedIds}
          onOpen={updating.open}
          onToggle={removal.toggle}
        />
      )}

      {removal.selecting ? (
        <SelectionToolbar
          count={removal.count}
          removeLabel={t("selection.remove")}
          cancelLabel={t("selection.cancel")}
          onRemove={removal.askToRemove}
          onCancel={removal.cancel}
        />
      ) : (
        <div className={styles.actions}>
          <Button
            variant="ghost"
            className={styles.action}
            onClick={adding.open}
            disabled={skills === undefined || busy}
          >
            <AddIcon />
            {t("actions.add")}
          </Button>
          <Button
            variant="text"
            className={styles.action}
            onClick={removal.start}
            disabled={skills === undefined || skills.length === 0 || busy}
          >
            <DeleteForeverIcon />
            {t("actions.remove")}
          </Button>
        </div>
      )}

      <AddCvSkillModal adding={adding} />
      <UpdateCvSkillModal updating={updating} />
      <RemoveCvSkillsModal
        open={removal.confirming}
        count={removal.count}
        pending={removal.pending}
        onConfirm={() => void removal.confirm()}
        onCancel={removal.cancelConfirm}
      />
    </div>
  );
}

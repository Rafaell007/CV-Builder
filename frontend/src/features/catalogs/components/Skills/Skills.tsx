"use client";

import { useTranslations } from "next-intl";
import type { DataTableColumn } from "@/shared/components";
import { toListVariables, useListState } from "@/shared/lists";
import { DEFAULT_CATALOG_SORT } from "../../catalogs.constants";
import type { CatalogNamespace } from "../../catalogs.types";
import { useDeleteCatalogItem } from "../../useDeleteCatalogItem";
import { CatalogPage } from "../CatalogPage";
import { SkillFormModal } from "./SkillFormModal";
import type { SkillListItem } from "./skills.types";
import { useCreateSkill } from "./useCreateSkill";
import { useCreateSkillForm } from "./useCreateSkillForm";
import { useDeleteSkill } from "./useDeleteSkill";
import { useSkillCategories } from "./useSkillCategories";
import { useSkills } from "./useSkills";
import { useUpdateSkill } from "./useUpdateSkill";
import { useUpdateSkillForm } from "./useUpdateSkillForm";

const NAMESPACE: CatalogNamespace = "catalogs.skills";

/**
 * Content of the `/admin/skills` page under its `PageHeader`: the shared `CatalogPage` with the skill requests,
 * the Type and Category columns and the skill modals. The backend searches, sorts and cuts the pages.
 */
export function Skills() {
  const t = useTranslations(NAMESPACE);
  const list = useListState(DEFAULT_CATALOG_SORT);
  const query = useSkills(toListVariables(list));
  const { create } = useCreateSkill();
  const { update } = useUpdateSkill();
  const { remove } = useDeleteSkill();

  const creation = useCreateSkillForm(create);
  const editing = useUpdateSkillForm(update);
  const deletion = useDeleteCatalogItem(NAMESPACE, remove);
  // The categories are loaded only while a modal needs them.
  const categories = useSkillCategories(creation.isOpen || editing.isOpen);

  // Figma order: Name (from CatalogTable), Type, Category. Only Name is sortable.
  const extraColumns: DataTableColumn<SkillListItem>[] = [
    { id: "type", header: t("columns.type"), cell: (skill) => skill.category.type },
    { id: "category", header: t("columns.category"), cell: (skill) => skill.category.name },
  ];

  return (
    <CatalogPage
      namespace={NAMESPACE}
      list={list}
      query={query}
      extraColumns={extraColumns}
      onCreate={creation.open}
      onEdit={editing.open}
      deletion={deletion}
      modals={
        <>
          <SkillFormModal kind="create" skillForm={creation} categories={categories} />
          <SkillFormModal kind="update" skillForm={editing} categories={categories} />
        </>
      }
    />
  );
}

# Skills module

The global skills catalog (PLAN.md S5.3, §7) and its categories. Admin only.

- **GraphQL:**
  - `skills` returns every skill as `{ id, name }` (`EnvironmentSkill` of the projects module), ordered by name. The Projects form uses it to fill the Environment field.
  - `skillCatalog(search, sort, page)` returns a `SkillPage` `{ items, total }` for the admin Skills page. Each `Skill` has `id`, `name` and `category { id name type }`. Search is on the name without regard to letter case; sort is by `name` only (any other field gives `BAD_USER_INPUT`), then by id.
  - `skillCategories` returns every `SkillCategory` `{ id, name, type }`, ordered by name, for the Category field of the forms. Categories are seeded; there is no API to change them.
  - `createSkill(input: { name, categoryId })` and `updateSkill(input: { id, name, categoryId })` return the `Skill`. `deleteSkill(id)` returns `true`.
- **Type:** a skill has no type of its own. It is the `type` of its category (page 17), so changing the category changes the type. The inputs have no `type` field; GraphQL refuses one.
- **Names (D35):** the input trims the name and turns each run of whitespace into one space (`NormalizeSpaces`). The column is `citext` with a `CHECK` of 100 characters (migration `20261119171302_case_insensitive_skill_names`), so "React" and "react" are the same name. The name keeps the letter case the admin typed.
- **Errors:** the database is the guard, so there is no check before the write and no race.
  - Duplicate name (unique index, `P2002`) → `CONFLICT` "Skill already exists". Saving the same name again, or only another letter case of its own name, is allowed.
  - Unknown category on create or update (foreign key, `P2003`) → `BAD_USER_INPUT` with a field error on `categoryId` "Category not found".
  - Unknown skill (`P2025`) → `NOT_FOUND` "Skill not found".
  - Delete of a skill in use (`P2003`) → `CONFLICT` "Skill cannot be deleted because it is currently in use". In use (D18): a user has it (`UserSkill`), a CV has it (`CvSkill`) or a project environment has it (`ProjectSkill`); all three links are `Restrict`.
- **Authorization:** `@Roles(Role.ADMIN)` on `SkillsResolver`.
- **Tests:** `*.spec.ts` next to the code; `backend/test/skills/skills.int-spec.ts` runs every operation over HTTP against the test database.
- **Docs:** [Skills page (admin)](../../../../docs/pages/17-skills-page-admin.md) · [PLAN.md S5.3](../../../../PLAN.md)

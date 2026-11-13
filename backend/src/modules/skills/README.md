# Skills module

The skills catalog (PLAN.md S5.3, §7). Admin only.

- **GraphQL:** `skills` returns every skill as `{ id, name }`, ordered by name. It reuses the `EnvironmentSkill` type of the projects module. The Projects form uses it to fill the Environment field.
- **Not yet here:** categories, create, update and delete of skills (S5.3). Add them to this module.
- **Authorization:** `@Roles(Role.ADMIN)` on `SkillsResolver`.
- **Tests:** `*.spec.ts` next to the code; `backend/test/skills/skills.int-spec.ts` runs the query over HTTP against the test database.
- **Docs:** [PLAN.md S5.3](../../../../PLAN.md)

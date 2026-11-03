# Projects module

The global catalog of projects (page 27) and the project roles. Admin only, except `projectRoles` (PLAN.md §7, D18, D25).

- **GraphQL:**
  - `projects(search, sort, page)` returns `ProjectPage` (`{ items, total }`). `search` matches name and domain, without regard to case. `sort.field` is `name`, `startDate` or `endDate`; the default is `name` ascending. Projects with the same value are ordered by id, so pages do not repeat items.
  - `createProject(input)`, `updateProject(input)` return the `Project`. `updateProject` replaces all fields and the whole environment. `deleteProject(id)` returns `true`.
  - `projectRoles` returns all roles by name. Any signed-in user may call it, because the CV forms (S7.4) need it.
- **`Project`:** `id`, `name`, `domain`, `startDate`, `endDate`, `description`, `environment`, `createdAt`, `updatedAt`. `environment` is a list of `{ id, name }`: the skills of the project (`ProjectSkill`). The skill list for the form comes from the skills catalog (S5.3).
- **Limits:** name and domain up to 100 characters, description up to 2000, all required and trimmed. `environmentIds` is optional, has no duplicates, and every id must be an existing skill.
- **Dates:** stored as `DATE`. The service cuts a time off, and the end date may be equal to the start date but not earlier. The error is `BAD_USER_INPUT` with a field error on `endDate`.
- **Errors:** `NOT_FOUND` for an unknown project. `CONFLICT` with the number of CVs in the message when
  - `deleteProject` is called for a project that a CV uses (D18), or
  - `updateProject` changes the dates and CV entries would fall outside them (D25). An empty CV end date ("Present") is not checked. The check runs only when a date changes.
- **Authorization:** `@Roles(Role.ADMIN)` on `ProjectsResolver`. `ProjectRolesResolver` has no role, so every signed-in user may use it.
- **Tests:** `*.spec.ts` next to the code; `backend/test/projects.int-spec.ts` runs every operation over HTTP against the test database.
- **Docs:** [projects page](../../../../docs/pages/27-projects-page.md) · [PLAN.md S5.5, D18, D25](../../../../PLAN.md)

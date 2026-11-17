# Departments module

The global catalog of departments (page 25). A user can be assigned one department. Admin only (PLAN.md §7, D18).

- **GraphQL:**
  - `departments(search, sort, page)` returns `DepartmentPage` (`{ items, total }`). `search` matches the name, without regard to case. `sort.field` can only be `name`; the default is `name` ascending. Departments with the same value are ordered by id, so pages do not repeat items.
  - `createDepartment(input)`, `updateDepartment(input)` return the `Department`. `deleteDepartment(id)` returns `true`.
- **`Department`:** `id`, `name`.
- **Limits:** name required, up to 100 characters, trimmed. Nothing else is normalised: uniqueness is case-sensitive (PLAN.md §7, "Unique names are normalised (trimmed)").
- **Errors:**
  - `CONFLICT` "Department already exists" for a duplicate name. The service maps the unique constraint error (`P2002`). Saving a department with its own name is allowed.
  - `CONFLICT` "Department cannot be deleted because it is currently in use" when a user still has the department. There is no count check first: the `Restrict` foreign key on `User.departmentId` refuses the delete (`P2003`) and the service maps it (D18).
  - `NOT_FOUND` "Department not found" for an unknown id (`P2025`). `BAD_USER_INPUT` for an id that is not a UUID.
- **Authorization:** `@Roles(Role.ADMIN)` on `DepartmentsResolver`.
- **Same shape as:** the [Positions module](../positions/README.md). A fix in one usually belongs in both.
- **Tests:** `*.spec.ts` next to the code; `backend/test/departments/departments.int-spec.ts` runs every operation over HTTP against the test database.
- **Docs:** [departments page](../../../../docs/pages/25-departments-page.md) · [PLAN.md D18](../../../../PLAN.md)

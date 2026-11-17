# Positions module

The global catalog of positions (page 26). A user can be assigned one position. Admin only (PLAN.md §7, D18).

- **GraphQL:**
  - `positions(search, sort, page)` returns `PositionPage` (`{ items, total }`). `search` matches the name, without regard to case. `sort.field` can only be `name`; the default is `name` ascending. Positions with the same value are ordered by id, so pages do not repeat items.
  - `createPosition(input)`, `updatePosition(input)` return the `Position`. `deletePosition(id)` returns `true`.
- **`Position`:** `id`, `name`.
- **Limits:** name required, up to 100 characters, trimmed. Nothing else is normalised: uniqueness is case-sensitive (PLAN.md §7, "Unique names are normalised (trimmed)").
- **Errors:**
  - `CONFLICT` "Position already exists" for a duplicate name. The service maps the unique constraint error (`P2002`). Saving a position with its own name is allowed.
  - `CONFLICT` "Position cannot be deleted because it is currently in use" when a user still has the position. There is no count check first: the `Restrict` foreign key on `User.positionId` refuses the delete (`P2003`) and the service maps it (D18).
  - `NOT_FOUND` "Position not found" for an unknown id (`P2025`). `BAD_USER_INPUT` for an id that is not a UUID.
- **Authorization:** `@Roles(Role.ADMIN)` on `PositionsResolver`.
- **Same shape as:** the [Departments module](../departments/README.md). A fix in one usually belongs in both.
- **Tests:** `*.spec.ts` next to the code; `backend/test/positions/positions.int-spec.ts` runs every operation over HTTP against the test database.
- **Docs:** [positions page](../../../../docs/pages/26-positions-page.md) · [PLAN.md D18](../../../../PLAN.md)

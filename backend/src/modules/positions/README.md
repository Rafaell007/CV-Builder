# Positions module

The global catalog of positions (page 26). A user can be assigned one position. Admin only (PLAN.md §7, D18).

- **GraphQL:**
  - `positions(search, sort, page)` returns `PositionPage` (`{ items, total }`). `search` matches the name, without regard to case. `sort.field` can only be `name`; the default is `name` ascending. Positions with the same value are ordered by id, so pages do not repeat items.
  - `createPosition(input)`, `updatePosition(input)` return the `Position`. `deletePosition(id)` returns `true`.
- **`Position`:** `id`, `name`.
- **Limits:** name required, up to 100 characters. `NormalizeSpaces()` trims it and turns each run of whitespace inside into one space. The column is `citext`, so the unique check and the sort ignore letter case; the name keeps the case the admin typed (D35). The 100-character limit is also a `CHECK` in the database, because `citext` has no length.
- **Errors:**
  - `CONFLICT` "Position already exists" for a duplicate name. The service maps the unique constraint error (`P2002`). Saving a position with its own name is allowed.
  - `CONFLICT` "Position cannot be deleted because it is currently in use" when a user still has the position. There is no count check first: the `Restrict` foreign key on `User.positionId` refuses the delete (`P2003`) and the service maps it (D18).
  - `NOT_FOUND` "Position not found" for an unknown id (`P2025`). `BAD_USER_INPUT` for an id that is not a UUID.
- **Authorization:** `@Roles(Role.ADMIN)` on `PositionsResolver`.
- **Note (deploy):** migration `20261117154613_case_insensitive_catalog_names` changes `name` to `citext` and rebuilds the unique index. It fails if the database already holds two names that differ only in letter case (for example "developer" and "Developer"). Before `prisma migrate deploy` on a database with real data, check with `SELECT lower(name), count(*) FROM "Position" GROUP BY 1 HAVING count(*) > 1;` and rename or merge the duplicates. `CREATE EXTENSION citext` needs the database owner (citext is a trusted extension from PostgreSQL 13).
- **Same shape as:** the [Departments module](../departments/README.md). A fix in one usually belongs in both.
- **Tests:** `*.spec.ts` next to the code; `backend/test/positions/positions.int-spec.ts` runs every operation over HTTP against the test database.
- **Docs:** [positions page](../../../../docs/pages/26-positions-page.md) · [PLAN.md D18, D35](../../../../PLAN.md)

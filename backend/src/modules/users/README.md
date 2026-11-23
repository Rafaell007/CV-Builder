# Users module

The users list and the admin user management (PLAN.md S6.1, §8). Reading is for every signed-in user; create, update and delete are for admins. Sign-up, sign-in and sessions stay in the `auth` module.

- **GraphQL:**
  - `users(search, sort, page)` returns a `UserPage` `{ items, total }` for the Users page. `user(id)` returns one `User` for User Details (`NOT_FOUND` when missing). A `User` has `id`, `email`, `firstName`, `lastName`, `role`, `department { id name }` and `position { id name }`. Names, department and position are `null` for a user who signed up and has not filled in the profile yet. There is no field for the password hash (users page AC-18, AC-26).
  - `createUser(input: { email, password, firstName, lastName, departmentId, positionId, role })`, `updateUser(input: { id, firstName, lastName, departmentId, positionId, role })` return the `User`. `deleteUser(id)` returns `true`.
- **Search:** split into words; each word must be in the first name, the last name or the email, without regard to letter case ("alpha lim" finds Alpha Lima). `%`, `_` and `\` are plain characters (`escapeLike`).
- **Sort:** `firstName` (default, ascending), `lastName`, `department`, `position` (by the name of the department or position), then by id. Any other field gives `BAD_USER_INPUT`. Empty values follow PostgreSQL on every column: last in A→Z, first in Z→A (Prisma cannot set "nulls last" on a relation's column, so one rule for all).
- **Create:** the email is trimmed and lowercased (like sign-up, so sign-in finds it); the password follows D33 (8–128 characters with a letter and a digit, stricter than the page's "at least 6") and is stored only as an argon2 hash; names are trimmed, required, at most 100 characters. The user starts verified (D16).
- **Update:** names, department, position and role. Email and password are not in the input (users page AC-25); a password change has its own flow.
- **Delete:** the database cascade removes everything the user owns: CVs with their skills and projects, user skills and languages, avatar, codes and sessions (D13). The session ends at once: the auth guard reads the user from the database on every request, as it does for the role.
- **Errors:**
  - Unknown department or position → `BAD_USER_INPUT` with a field error on `departmentId` / `positionId` ("Department not found", "Position not found"), both at once. Checked before the write; a delete between the check and the write (`P2003`) gives the same error.
  - Email taken (unique index, `P2002`) → `CONFLICT` with `reason: "EMAIL_TAKEN"`, the same reason as sign-up.
  - Unknown user → `NOT_FOUND` "User not found".
  - PostgreSQL stopped the transaction because a parallel one needs the same rows (a deadlock or write conflict, `P2034`, e.g. a delete while the user's browser refreshes its token) → `CONFLICT` "The user was changed at the same time. Try again".
- **D24, `CONFLICT` with a `reason`:**
  - `SELF_DELETE`: an admin deletes themselves.
  - `OWN_ROLE`: an admin removes their own Admin role.
- **The last admin (D24)** needs no count and no own reason. Update and delete first lock the actor's and the target's rows (`SELECT … FOR NO KEY UPDATE`, one statement in id order, so no deadlock; it does not block the light lock a refresh-token insert takes, so sign-in and refresh never wait for an admin edit), then check and write in the same transaction. The actor must still be an admin inside the lock (`FORBIDDEN` otherwise: the guard checked the role before the request waited), and cannot demote or delete themselves. So every change keeps its actor an admin, and at least one admin always remains. Two admins who demote or delete each other at the same moment run one after the other; the second is no longer an admin and gets `FORBIDDEN`. Without the lock both could win and leave no admin; the integration tests send such requests in parallel.
- **Authorization:** the global guard needs a signed-in user for everything; `@Roles(Role.ADMIN)` on the three mutations. Reading needs no verified email (D16 does not list it).
- **Tests:** `*.spec.ts` next to the code; `backend/test/users/users.int-spec.ts` runs every operation over HTTP against the test database, including the parallel D24 cases.
- **Docs:** [Users page](../../../../docs/pages/10-users-page.md) · [PLAN.md S6.1, D13, D16, D24, D33](../../../../PLAN.md)

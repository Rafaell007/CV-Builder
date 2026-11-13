# CVs module

List, read, create, change and delete CVs. A user works with their own CVs. An admin works with all CVs (D10).

- **GraphQL:**
  - `cvs(search, sort, page, userId)` returns `{ items, total }`. `cv(id)` returns one CV.
  - `createCv(input)`, `updateCv(input)` and `deleteCv(id)` return the CV. `deleteCv` returns the CV that it removed.
  - `Cv.ownerEmail` is the "Employee" column of the table.
- **Own or all:** the service decides, not the client. A user always gets only their own CVs. An admin gets all CVs, and can narrow the list with `userId`. A user who sends the `userId` of another user gets `FORBIDDEN`.
- **Search:** case-insensitive, by CV name. For an admin, also by the email of the owner. A user cannot search by email.
- **Sort:** only `name` (`resolveSort` rejects all other fields). Equal names are ordered by `id`, so pages do not overlap. The default is `name` ascending.
- **Page size:** the shared default of 10 (D19, `DEFAULT_PAGE_SIZE` in `common/pagination`). `cvs` has no own value since 2026-11-12. A client can still send another `size` (maximum 100).
- **Owner:** `createCv` makes the signed-in user the owner. An admin can set `userId` to create a CV for another user. If that user does not exist, the answer is `BAD_USER_INPUT` with a field error on `userId`. `updateCv` cannot change the owner.
- **Access errors:** a CV of another user gives `NOT_FOUND`, the same as a missing CV. A user cannot find out which ids exist. An id that is not a UUID gives `BAD_USER_INPUT`.
- **Verified only (D16):** `createCv`, `updateCv` and `deleteCv` use `@Verified()`. Reading needs only a session.
- **Validation:** name and education are required and have at most 255 characters. Description is required and has at most 2000 characters (the database column has no limit, the API sets one). Text is trimmed first, with the shared `Trim` decorator. The messages are the ones of the page docs (`Name is required`).
- **Parallel deletes:** if another request deletes a CV between the access check and `updateCv` or `deleteCv`, the answer is `NOT_FOUND` (Prisma error P2025), not a server error.
- **Delete:** a CV removes its skills and projects with it. Deleting a user removes their CVs (D13).
- **Tests:** `cvs.service.spec.ts` and `cvs.resolver.spec.ts` next to the code. `backend/test/cvs.int-spec.ts` runs over HTTP against the test database.
- **Docs:** [CVs page](../../../../docs/pages/20-cvs-page.md) · [CV details page](../../../../docs/pages/21-cv-details-page.md) · [PLAN.md S7.1, D10, D16](../../../../PLAN.md)

## CV projects (S7.4a)

The projects of one CV: `cv-projects.service.ts`, `cv-projects.resolver.ts`, `cv-project-dates.ts`, `dto/*cv-project*`, `models/cv-project.ts`.

- **GraphQL:**
  - `cvProjects(cvId, search, sort)` returns `[CvProject!]!`. There is no paging: a CV holds few projects, and the page doc has no pager.
  - `addCvProject(input)` and `updateCvProject(input)` return the `CvProject`. `removeCvProjects(input: { cvId, ids })` returns `true`.
  - `CvProject` has `id`, `cvId`, `project` (the full catalog `Project` with its environment), `roles`, `startDate`, `endDate` (`null` = Present), `responsibilities`, `createdAt`, `updatedAt`.
- **Access:** every operation first calls `CvsService.assertAccessible`, the same rule as for the CV: owner or admin, else `NOT_FOUND`. `updateCvProject` finds the CV through the entry, so a user cannot change an entry of another CV by sending its id. `removeCvProjects` deletes only entries of the named CV.
- **Verified only (D16):** the three mutations use `@Verified()`. Reading needs only a session.
- **Search:** case-insensitive, by project name and domain. **Sort:** `name` (the project name), `startDate`, `endDate`. Default is `name` ascending. Equal values are ordered by `id`. Present (no end date) counts as the latest end: last when ascending, first when descending. The CV id is always part of the filter, so search and sort never leave the CV (AC-40).
- **Dates:** stored as `DATE`; the service cuts the time off in UTC (send 00:00 UTC, as for projects). The start date is required. The end date is optional. Rules: both within the project dates, the end not before the start. The error is `BAD_USER_INPUT` with field errors on `startDate` and `endDate`, with the messages of the page doc. The page doc rule "Start date is required" is enforced by the schema type `DateTime!`: a missing or `null` start date is refused by GraphQL before the service runs.
- **Roles:** `roleIds` has 1 to 50 unique ids (`At least one role must be selected`). Every id must be an existing `ProjectRole`, else `BAD_USER_INPUT` on `roleIds`. `updateCvProject` replaces all roles. There is no "active" flag on `ProjectRole`, so every role in the table counts as active.
- **Responsibilities:** optional, trimmed, at most 2000 characters (a team choice, `MAX_RESPONSIBILITIES_LENGTH`). An empty text is stored as no value.
- **Project:** `addCvProject` needs an existing `projectId` (else `BAD_USER_INPUT` on `projectId`). The project of an entry cannot change: `UpdateCvProjectInput` has no `projectId`. The catalog is never written.
- **Duplicates:** the unique index `(cvId, projectId)` is the guard. The service turns the error into `CONFLICT` ("The project is already in this CV"). Two parallel requests for the same project give one entry and one `CONFLICT`.
- **Parallel changes (D25):** `addCvProject` and `updateCvProject` run in a serializable transaction, like `ProjectsService.update`. If a project date changes at the same moment, one of the two fails with `CONFLICT` ("Try again"), so an entry cannot end up outside the project dates.
- **Remove:** all or nothing. If one id is not in the CV, the answer is `NOT_FOUND` and nothing is removed. The roles of the entry go with it (cascade). The project and the roles of the catalogs stay (AC-23, AC-39).
- **Tests:** `cv-projects.service.spec.ts`, `cv-projects.resolver.spec.ts` and `cv-project-dates.spec.ts` next to the code. `backend/test/cv-projects.int-spec.ts` runs over HTTP against the test database.
- **Docs:** [CV projects page](../../../../docs/pages/23-cv-projects-page.md) · [PLAN.md S7.4, D16, D18, D25](../../../../PLAN.md)

## Things to note

- **Open (catalog for employees):** the Add project modal needs the list of catalog projects. `projects` is admin only (`@Roles(Role.ADMIN)`), so a normal user cannot call it. The ticket KAN-115 does not cover this. Before the frontend of S7.4 can work for a user, the team must decide: a read-only catalog query for every signed-in user (like `projectRoles`), or a query that returns only the projects not yet in the CV. Not done here.
- **Open (list shape):** `cvProjects` returns a plain list, not `{ items, total }` with paging like `cvs`. If the team wants the shared list shape, change the return type and add `ListArgs`. The frontend must then run `codegen`.
- **Bulk remove:** the ticket names the mutation `removeCvProjects` (plural), so it takes a list of ids with the CV id and returns `true`. The delete modal removes one entry: send a list with one id.
- **Contract (for the frontend):** `schema.gql` gained `CvProject`, `AddCvProjectInput`, `UpdateCvProjectInput`, `RemoveCvProjectsInput`, `cvProjects`, `addCvProject`, `updateCvProject` and `removeCvProjects`. Nothing was removed. The frontend must run `codegen`.

- **Contract (for the frontend, KAN-111):** `cvs` has `page: PageInput! = {number: 1, size: 10}` (D19). It was 20 before. A client that sent no `page` now gets 10 items. The frontend must run `codegen` and may drop an explicit `size: 10`. Other lists still default to 20. Call this out in every PR that changes `schema.gql`.
- **Description cap:** 2000 characters is a team choice, not a page-doc rule (`MAX_DESCRIPTION_LENGTH` in `dto/cv-fields.ts`). Change it in one place if the mentor wants another number. The error message uses the constant.
- **Schema in history:** in KAN-111 the merge commit holds a `schema.gql` that is already regenerated with the page default of 10, one commit before the code that sets it. Do not bisect on that single commit. `CI` checks only the final state.
- **Open (frontend):** the CVs page and the CV details page (S7.1 and S7.2 front end) are not built. `PLAN.md` S7.1 stays unticked until then.

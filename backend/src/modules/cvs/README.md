# CVs module

List, read, create, change and delete CVs. A user works with their own CVs. An admin works with all CVs (D10).

- **GraphQL:**
  - `cvs(search, sort, page, userId)` returns `{ items, total }`. `cv(id)` returns one CV.
  - `createCv(input)`, `updateCv(input)` and `deleteCv(id)` return the CV. `deleteCv` returns the CV that it removed.
  - `Cv.ownerEmail` is the "Employee" column of the table.
- **Own or all:** the service decides, not the client. A user always gets only their own CVs. An admin gets all CVs, and can narrow the list with `userId`. A user who sends the `userId` of another user gets `FORBIDDEN`.
- **Search:** case-insensitive, by CV name. For an admin, also by the email of the owner. A user cannot search by email.
- **Sort:** only `name` (`resolveSort` rejects all other fields). Equal names are ordered by `id`, so pages do not overlap. The default is `name` ascending.
- **Page size:** the default is 20 (shared code). The table sends 10 (D19).
- **Owner:** `createCv` makes the signed-in user the owner. An admin can set `userId` to create a CV for another user. If that user does not exist, the answer is `BAD_USER_INPUT` with a field error on `userId`. `updateCv` cannot change the owner.
- **Access errors:** a CV of another user gives `NOT_FOUND`, the same as a missing CV. A user cannot find out which ids exist. An id that is not a UUID gives `BAD_USER_INPUT`.
- **Verified only (D16):** `createCv`, `updateCv` and `deleteCv` use `@Verified()`. Reading needs only a session.
- **Validation:** name and education are required and have at most 255 characters. Description is required. Text is trimmed first. The messages are the ones of the page docs (`Name is required`).
- **Delete:** a CV removes its skills and projects with it. Deleting a user removes their CVs (D13).
- **Tests:** `cvs.service.spec.ts` and `cvs.resolver.spec.ts` next to the code. `backend/test/cvs.int-spec.ts` runs over HTTP against the test database.
- **Docs:** [CVs page](../../../../docs/pages/20-cvs-page.md) · [CV details page](../../../../docs/pages/21-cv-details-page.md) · [PLAN.md S7.1, D10, D16](../../../../PLAN.md)

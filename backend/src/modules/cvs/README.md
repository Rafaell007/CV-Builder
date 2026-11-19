# CVs module

List, read, create, change and delete CVs. A user works with their own CVs. An admin works with all CVs (D10).

- **Folders:** CV projects live in `cv-projects/`, CV skills in `cv-skills/` the CV preview in `cv-preview/` and the PDF export in `cv-pdf/` (each has resolver, service, `dto/`, `models/`, specs).
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
- **Tests:** `cvs.service.spec.ts` and `cvs.resolver.spec.ts` next to the code. `backend/test/cvs/cvs.int-spec.ts` runs over HTTP against the test database.
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
- **Tests:** `cv-projects.service.spec.ts`, `cv-projects.resolver.spec.ts` and `cv-project-dates.spec.ts` in `cv-projects/`. `backend/test/cvs/cv-projects.int-spec.ts` runs over HTTP against the test database.
- **Docs:** [CV projects page](../../../../docs/pages/23-cv-projects-page.md) · [PLAN.md S7.4, D16, D18, D25](../../../../PLAN.md)

## CV skills (S7.3a)

The skills of one CV, in `cv-skills/`: `cv-skills.service.ts`, `cv-skills.resolver.ts`, `dto/`, `models/`, specs. The shared `Mastery` enum and `SkillCategory` type are in `modules/skills/models/`.

- **GraphQL:**
  - `cvSkills(cvId)` returns `[CvSkill!]!`. `availableCvSkills(cvId)` returns the skills that the owner of the CV has and that are not yet in the CV. There is no paging.
  - `addCvSkill(input: { cvId, skillId, mastery? })` and `updateCvSkill(input: { id, mastery })` return the `CvSkill`. `removeCvSkills(input: { cvId, ids })` returns `true`.
  - `CvSkill` has `id` (the CV-skill link), `cvId`, `skillId` (the catalog skill), `name`, `category { id name }`, `mastery`, `createdAt`, `updatedAt`. The list is ordered by category name, then skill name, then id.
- **Access:** every operation first calls `CvsService.assertAccessible`, the same rule as for the CV: owner or admin, else `NOT_FOUND`. `updateCvSkill` finds the CV through the link, so a user cannot change a link of another CV by sending its id. `removeCvSkills` deletes only links of the named CV.
- **Verified only (D16):** the three mutations use `@Verified()`. Reading needs only a session.
- **Available skills:** the source is the `UserSkill` rows of the **owner of the CV**, not of the person who asks. An admin who adds a skill to the CV of another user sees and can use only the skills of that user. `addCvSkill` checks the same rule again. A skill that the owner does not have gives `BAD_USER_INPUT` with a field error on `skillId`. A skill that does not exist gives the same answer.
- **Mastery:** it belongs to the CV and can differ from the owner's level. `addCvSkill` without `mastery` copies the owner's level. `updateCvSkill` changes only the mastery of the link, never the owner's skill. The skill of a link cannot change (page doc: the Skill field is disabled in the Update modal).
- **Duplicates:** the unique index `(cvId, skillId)` is the guard. The service turns the error into `CONFLICT` ("The skill is already in this CV"). Two parallel requests for the same skill give one link and one `CONFLICT`.
- **Remove:** all or nothing. If one id is not in the CV, the answer is `NOT_FOUND` and nothing is removed. The skills of the catalog and of the owner stay (AC-36). Deleting a CV removes its links with it.
- **Tests:** `cv-skills.service.spec.ts` and `cv-skills.resolver.spec.ts` next to the code. `backend/test/cvs/cv-skills.int-spec.ts` runs over HTTP against the test database.
- **Docs:** [CV skills page](../../../../docs/pages/22-cv-skills-page.md) · [PLAN.md S7.3](../../../../PLAN.md)

## CV preview (S7.5a)

The read model of the CV preview page, in `cv-preview/`: `cv-preview.service.ts`, `cv-preview.resolver.ts`, `calculations/` (one small function per file, each with a spec), `dto/cv-preview.args.ts`, `models/` and specs. There is a short extra README in the folder.

- **GraphQL:** `cvPreview(cvId, locale)` returns one `CvPreview`. `locale` is optional: `en` (default) or `pl`, any other value gives `BAD_USER_INPUT`. It changes only the word for an open period (see Period). There is no paging. It has `cvId`, `name`, `education`, `description`, `fullName` (`null` without a profile name), `position` (`null` without a position), `languages { name proficiency }`, `domains`, `skillGroups { category skills { name mastery experienceYears lastUsedYear } }` and `projects { name description domain environment roles period startDate endDate responsibilities }`.
- **Access:** the service first calls `CvsService.assertAccessible`, the same rule as for the CV: owner or admin, else `NOT_FOUND`. Nothing is loaded before this check passes. A missing CV, a CV of another user and an unknown id give the same answer. An id that is not a UUID gives `BAD_USER_INPUT`.
- **Read only:** the query has no `@Verified()`. It needs a session only, like the other CV reads. Without a session the answer is `UNAUTHENTICATED`.
- **Data of the CV only:** skills and projects come from this CV (`cvId` is in every filter). Other CVs of the same owner and skills that the owner has but did not add to the CV never appear. Name and position come from the owner of the CV, not from the person who asks (an admin sees the data of the owner).
- **Ordering:** skill groups by category name, skills in a group by name. Projects by start date, newest first, then by id. Languages by name. Roles and environment by name.
- **Calculations (`calculations/`):** the environment of the CV projects is the only source, and a skill is matched by its id.
  - Experience: whole years, rounded down, from the earliest start date of the CV projects that use the skill, up to now. Never negative.
  - Last used: the end year of the most recent matching project. A project without an end date counts as the most recent and gives the current year.
  - A skill that is in no project environment of the CV gets `null` for both values.
  - Domains: the domains of the CV projects, each once.
- **Period:** `MM.YYYY – MM.YYYY`, or `MM.YYYY – Till now` (`MM.YYYY – obecnie` for `locale: pl`) when the project has no end date. The words are in `cv-locale.ts` (`OPEN_PERIOD_WORDS`), together with the list of languages (`CV_LOCALES`), and the preview and the PDF both use them. The separator is an en dash. `startDate` and `endDate` are also returned for the client.
- **Empty values:** a project without roles gives `[]`. A project without responsibilities gives `null`.
- **Proficiency enum:** the Prisma enum is registered for GraphQL in `cv-preview/models/proficiency.enum.ts`, because the CV preview is the first type that uses it. If a languages module registers it later, merge the two registrations. Registering the same name twice breaks the schema.
- **Tests:** specs next to the code (`cv-preview.service.spec.ts`, `cv-preview.resolver.spec.ts` and one spec per calculation). `backend/test/cvs/cv-preview.int-spec.ts` runs over HTTP against the test database. It takes the years from the real current date, because the test app uses the system clock.
- **Docs:** [CV preview page](../../../../docs/pages/24-cv-preview-page.md) · [PLAN.md](../../../../PLAN.md)

## CV PDF export (S7.6a, KAN-119)

The PDF of a CV, in `cv-pdf/`: `cv-pdf.service.ts`, `cv-pdf.resolver.ts`, `cv-pdf-document.ts` (the content), `cv-pdf-renderer.ts` (pdfmake and the fonts), `cv-pdf-file-name.ts`, `cv-pdf-labels.ts` (the fixed texts per language; the list of languages is in `../cv-locale.ts`), `dto/`, `models/` and specs.

- **GraphQL:** `exportCvPdf(cvId, locale)` returns `CvPdf { fileName base64 }`. `locale` is optional: `en` (default) or `pl`. Any other value gives `BAD_USER_INPUT`. It is a query, because it changes no data. The client decodes the base64 text and saves the file. A download endpoint was not made, to keep one transport and the same session check as the other CV reads.
- **Same data as the preview (AC-21):** the service calls `CvPreviewService.get` and builds the document from that object. The years, periods and domains are not calculated again. The call also does the access check (owner or admin, else `NOT_FOUND`), and no PDF is made before it passes (AC-30, AC-49).
- **Content:** the sections of the preview page: header, general information, summary, skills, projects and the Professional skills table. Empty parts are left out, like on the page. A missing year shows an en dash. The fixed texts (section titles, column names, the level Native and the end of an open period) come from `cv-pdf-labels.ts` in the language of `locale`. The Polish texts are the ones of the preview page (`cvs.preview` in `pl.json`). The content of the CV is never translated. The frontend sends the language of the page. To add a language: add it to `CV_LOCALES` and `OPEN_PERIOD_WORDS` in `cv-locale.ts` and to `LABELS` (the types force every text), and to the frontend locales.
- **Period:** the PDF asks `CvPreviewService.get` for the data in its own language, so it prints `project.period` of the preview, which says `obecnie` for `pl`. The page and its PDF in the same language show the same period.
- **File name:** made from the CV name: lower case, words joined with `-`, accents removed, Cyrillic letters kept, `cv.pdf` when nothing is left (AC-22).
- **Fonts:** Roboto (Latin and Cyrillic) from the `fonts/Roboto` folder of the `pdfmake` package. No font file is stored in this repository. If a pdfmake update moves the folder, `cv-pdf-renderer.spec.ts` fails.
- **Safety:** the renderer allows pdfmake to read local files only from the font folder, and allows no URL. Text of a CV cannot make the server read a file or call an address.
- **Errors:** a failure in the PDF step is logged with the details and the client gets `The PDF could not be generated` only (AC-47).
- **Tests:** specs next to the code. `cv-pdf-renderer.spec.ts` makes a real PDF with Cyrillic text. `backend/test/cvs/cv-pdf.int-spec.ts` runs over HTTP against the test database.
- **Docs:** [CV preview page, Export PDF](../../../../docs/pages/24-cv-preview-page.md) · [PLAN.md S7.6](../../../../PLAN.md)

## Things to note

- **Contract (for the frontend, KAN-114):** `schema.gql` gained `CvSkill`, `AvailableCvSkill`, `SkillCategory`, `Mastery`, `AddCvSkillInput`, `UpdateCvSkillInput`, `RemoveCvSkillsInput`, `cvSkills`, `availableCvSkills`, `addCvSkill`, `updateCvSkill` and `removeCvSkills`. Nothing was removed. The frontend must run `codegen`.
- **Open (KAN-107):** the skills of a user (`UserSkill`) have no API yet. `availableCvSkills` reads the table directly, so it works now. When KAN-107 adds a user skills service, `CvSkillsService` can call it instead.
- **Open (mastery in the Add modal):** the page doc shows only the Skill field in the Add modal. The mutation takes an optional `mastery` and copies the owner's level when it is missing. If the team wants the Add modal to show a level, the contract already supports it.

- **Open (catalog for employees):** the Add project modal needs the list of catalog projects. `projects` is admin only (`@Roles(Role.ADMIN)`), so a normal user cannot call it. The ticket KAN-115 does not cover this. Before the frontend of S7.4 can work for a user, the team must decide: a read-only catalog query for every signed-in user (like `projectRoles`), or a query that returns only the projects not yet in the CV. Not done here.
- **Open (list shape):** `cvProjects` returns a plain list, not `{ items, total }` with paging like `cvs`. If the team wants the shared list shape, change the return type and add `ListArgs`. The frontend must then run `codegen`.
- **Bulk remove:** the ticket names the mutation `removeCvProjects` (plural), so it takes a list of ids with the CV id and returns `true`. The delete modal removes one entry: send a list with one id.
- **Contract (for the frontend):** `schema.gql` gained `CvProject`, `AddCvProjectInput`, `UpdateCvProjectInput`, `RemoveCvProjectsInput`, `cvProjects`, `addCvProject`, `updateCvProject` and `removeCvProjects`. Nothing was removed. The frontend must run `codegen`.

- **Contract (for the frontend, KAN-111):** `cvs` has `page: PageInput! = {number: 1, size: 10}` (D19). It was 20 before. A client that sent no `page` now gets 10 items. The frontend must run `codegen` and may drop an explicit `size: 10`. Other lists still default to 20. Call this out in every PR that changes `schema.gql`.
- **Description cap:** 2000 characters is a team choice, not a page-doc rule (`MAX_DESCRIPTION_LENGTH` in `dto/cv-fields.ts`). Change it in one place if the mentor wants another number. The error message uses the constant.
- **Schema in history:** in KAN-111 the merge commit holds a `schema.gql` that is already regenerated with the page default of 10, one commit before the code that sets it. Do not bisect on that single commit. `CI` checks only the final state.
- **Open (frontend):** the CVs page and the CV details page (S7.1 and S7.2 front end) are not built. `PLAN.md` S7.1 stays unticked until then.

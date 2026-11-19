# E2E tests

Playwright tests that drive a real browser through the whole app: Next.js → NestJS → PostgreSQL (PLAN §11.4, D14). Specs live in one folder per area (`smoke/`, `session/`, `auth/`, `i18n/`, `sign-up/`, `verify-email/`, `forgot-password/`, `reset-password/`, `app-shell/`, `projects/`, `cvs/`, `settings/`, …). Every page URL starts with the language (`/en/users`); a path without one is redirected, so specs may use either. `support/signIn.ts` signs a seeded account in through the API (not through the page, which `auth/` covers); most specs start with it, because protected pages redirect without a session. `support/graphql.ts` sends one GraphQL request with the cookies of the context. `support/cvs.ts` creates and deletes CVs of the signed-in user through the API (the `cvs` spec removes its CVs after each test; `user-cvs/user-cvs.spec.ts` signs in as `user1` and as the admin, and an admin session removes the CVs of both by name). `support/cvSkills.ts` adds skills to a CV through the API (`addCvSkillsByName`), so the CV skills spec does not click through the Add skill modal for its set-up. `support/projects.ts` creates and deletes projects through the API, so a spec can get more than one page of data (the `projects` spec removes them after each test; `deleteProjectsByName` also removes projects that a test made through the page). Specs that add or change data share one file with the specs that count the seed data, because the tests of one file run one after another; two files would run in parallel on one database. The exception is `cvs/cvs.spec.ts`: it counts the CVs of `user1` and the admin, while `cv-details.spec.ts` and `cv-skills.spec.ts` create CVs for the same users. So `playwright.config.ts` runs it in its own project, `cvs-list`, first and alone; the `chromium` project with all other specs depends on it. The counts also skip rows with `E2E` in the name (`seedRows`). A file that changes no data may be a file of its own: `projects/projects.a11y.spec.ts` (keyboard, focus return, themes, tablet width) only opens and cancels modals. It sets the theme with the `theme` cookie, like a saved choice of the user. `support/signUp.ts` does the same for a new, unverified account (the seeded users are all verified); the `verify-email` spec uses it, and the `settings` spec signs up a new account per test, so changing its password never breaks a spec that signs in with a seeded user.

## Run

Needs Docker (`docker compose up -d`, which also starts Mailpit: the `sign-up` and `verify-email` specs read the verification mail and the `forgot-password` and `reset-password` specs read the reset link, all through `support/mailpit.ts`) and, once per machine, the browser: `pnpm --filter @cv-builder/e2e exec playwright install chromium`.

```
pnpm test:e2e
```

Each run:

1. `e2e:db` (backend) empties `cv_builder_test` and seeds it, so every run starts from the same data. Accounts: see "Seed data and test users" in the root README.
2. Builds and starts the backend on port 4100 and the frontend on port 3100. A running `pnpm dev` (3000 / 4000, development database) is never used. The backend runs with `THROTTLE_LIMIT=1000`: all specs share one IP and most sign in first, so the default of 10 calls per minute would fail them. The throttle is tested in `backend/test/auth/throttling.int-spec.ts`.
3. Runs the specs in Chromium.

The HTML report is written to `e2e/playwright-report/` (`pnpm --filter @cv-builder/e2e exec playwright show-report`).

Docs: [Playwright webServer](https://playwright.dev/docs/test-webserver), [Next.js and Playwright](https://nextjs.org/docs/app/guides/testing/playwright).

## Test cases per area

Each bullet is one `test()`. The name of the spec file is in bold.

### app-shell

**navigation.spec.ts**
- A user sees 4 links, and the clicked page is marked as current.
- An admin sees 7 links, and Skills opens the admin page.
- The collapse button collapses and expands the sidebar.
- The profile menu opens the profile and settings.
- Logout ends the session.
- Below 768px, the device error replaces the page.
- From 768px, the page shows and the sidebar starts collapsed.

### auth

**sign-in.spec.ts**
- Shows the form with the Sign In tab active.
- Signs a seeded user in and opens the employees page.
- Shows an error and keeps the typed values after a wrong password.
- Shows a message under a field that is left wrong.
- Opens the sign up and forgot password pages.

### cvs

**cvs.spec.ts**
- Lists the CVs of all users, sorted by name ascending, with the owner email.
- A click on Name switches between descending and ascending, never to no sort.
- Searches the name and the owner email, without regard to case.
- Shows No CVs found when the search matches nothing, and keeps the search text.
- A click on a row opens the CV Preview page.
- View in the row menu opens the CV Preview page.
- The row menu does not open the CV by itself.
- Lists only the own CVs (user).
- A search by the email of another user finds nothing.
- Creates a CV: the modal closes, a toast shows and the row is in the list.
- Shows the messages of the page document and keeps CREATE disabled.
- Updates a CV: the modal starts filled and the new name shows in the list.
- Cancel in the delete modal keeps the CV, Confirm removes it.
- Goes back one page after the only CV of the last page is deleted.

**cv-details.spec.ts**
- Shows the breadcrumbs, the four tabs and the fields of the CV.
- UPDATE is disabled until a change, saves the change and keeps it after a reload.
- An empty required field shows its message and keeps UPDATE disabled.
- A click on a tab opens its route, and a reload keeps it.
- A user who opens the CV of another user sees CV not found, on every tab.
- An admin opens the CV of a user from the list.

**cv-preview-export.spec.ts**
- Downloads a PDF file with the CV name in the file name, and stays on the page.
- On the Polish page, the button is Polish and the PDF downloads too.
- Shows an error and keeps the preview when the PDF cannot be made.

**cv-projects.spec.ts**
- Shows the Projects tab as active, the breadcrumbs and the projects of the CV.
- Searches by name and by domain without case, and clears the search.
- Sorts by start date in both directions, and by name.
- Updates the responsibilities in the Update modal, with the project locked, and keeps them after a reload.
- Ignores a typed end date earlier than the start date.
- Removes a project after a confirmation, a cancel removes nothing, and the project stays in the catalog.
- Escape closes the row menu and the modal without a change.
- Shows the empty state and keeps ADD PROJECT available.
- An admin adds a project to the CV of a user: the form fills from the catalog, needs a role, and the project is kept.

**cv-skills.spec.ts**
- Shows the Skills tab as active, the breadcrumbs and the empty state.
- The Add skill modal offers only skills of the owner, and ADD waits for a choice.
- Adds skills, groups them by category and keeps them after a reload.
- Changes the mastery of a skill in this CV, and keeps the change after a reload.
- Removes the chosen skills after a confirmation, and a cancel removes nothing.
- Escape leaves the selection mode and clears the choice.
- An admin adds skills that the owner has, not skills of the admin.
- A user cannot open the skills of the CV of another user.

### error-pages

**no-internet.spec.ts**
- Going offline shows the screen; going online shows the page again.
- RETRY keeps the screen while queries fail and shows the page when they succeed.

**not-found.spec.ts**
- An unknown path shows the not-found screen.
- GO BACK opens the previous page.
- GO BACK without a previous page opens the start page.

### forgot-password

**forgot-password.spec.ts**
- Shows the title, the subtitle and the email field to a signed-out user.
- CANCEL leads to the sign-in page.
- Shows validation messages and sends nothing for an invalid email.
- A known email gets the confirmation and a mail with a reset link.
- An unknown email gets the same confirmation and no mail.
- Shows the page in Polish and keeps the language on its links.

### i18n

**i18n.spec.ts**
- A path without a language opens in English.
- A redirect keeps the language.
- An unknown page shows the not-found text in the language of the URL.
- Switching to Polish changes the texts.
- The chosen language stays after a refresh and on links without a language.

### projects

**projects.spec.ts**
- Lists the seeded projects, sorted by name ascending, with the Name arrow shown.
- A click on Name switches between descending and ascending, never to no sort.
- Sorts by the start date, oldest first and then newest first.
- Searches the name and the domain, with Enter and without regard to case.
- Searches after a short wait, without Enter.
- Shows No projects found and keeps the typed text when nothing matches.
- Keeps the search when the sort changes.
- Shows the page in Polish.
- Shows 10 projects on page 1 and the rest on page 2.
- Goes back to page 1 when the sort changes.
- Goes back to page 1 when the search changes, and hides the pages that fit on one.
- A user without the Admin role does not get the list.
- Creates a project: the modal closes, a toast shows and the row is in the list.
- Creates a project with technologies, then removes one of them with Update.
- Update opens with the technologies of the project as chips.
- Shows the date message and keeps Create disabled when the end is before the start.
- Cancel closes the create modal and saves nothing.
- Updates a project: the form is filled, the new name shows in the list.
- Deletes a project that no CV uses.
- Cancel keeps the project in the list.
- Shows the backend message and keeps the row when a CV uses the project.

**projects.a11y.spec.ts**
- The search field, CREATE PROJECT, the sort buttons and every row menu can be reached with Tab.
- A sort button works with Enter and with Space.
- The Create modal takes the focus, keeps it inside and gives it back to CREATE PROJECT on Escape.
- Cancel in the Create modal gives the focus back to CREATE PROJECT.
- The row menu opens with Enter, moves with the arrows and gives the focus back on Escape.
- Only one row menu is open at a time.
- Edit from the keyboard opens the filled modal, and Escape gives the focus back to the row menu button.
- The Delete modal keeps the focus inside, and Escape gives it back to the row menu button.
- The date picker opens its calendar from the keyboard and picks a day with Enter.
- Escape closes only the calendar, not the Create modal.
- Theme test: applies the theme and keeps the project rows readable.
- Theme test: shows the Create modal in the theme, with readable text.
- Tablet width: does not scroll sideways and hides the Domain column.
- Tablet width: the Create modal fits the screen and shows the two date fields side by side.
- Tablet width: the calendar opens inside the screen width.
- Tablet width: the calendar header is not cut by the modal.

### reset-password

**reset-password.spec.ts**
- Shows the title, the subtitle and masked fields for a link with a token.
- The eye button shows and hides the new password.
- Shows validation messages and sends nothing for invalid values.
- GO TO SIGN IN leads to the sign-in page.
- A link without a token shows the invalid notice and offers a new link.
- A token the backend does not know shows the invalid notice.
- The link from the mail sets a new password, once.
- Shows the page in Polish and keeps the language on its links.

### session

**session.spec.ts**
- A protected route redirects to sign-in.
- An admin-only route redirects to sign-in.
- The sign-in page opens.
- A signed-in user is sent from sign-in to the employees page.
- A user cannot open an admin-only route.
- An admin can open an admin-only route.
- An expired access token is refreshed before the page renders.
- A dead refresh token ends the session and clears the cookies.

### settings

**settings.spec.ts**
- Shows the selects with the current values and an empty password form.
- The chosen theme is applied and stays after a reload.
- The chosen language opens the page in that language.
- Changes the password: the new one signs in, the old one no longer does.
- A wrong current password is explained and the password stays the same.
- A password change signs out the other sessions of the user at once.

### sign-up

**sign-up.spec.ts**
- Shows the sign-up page with the SIGN UP tab active.
- SIGN IN and I HAVE AN ACCOUNT lead to the sign-in page.
- Shows validation messages and sends nothing for invalid values.
- The eye button shows and hides the password.
- A used email shows an error and keeps the values.
- Creates an account, signs the user in and mails the code.
- Shows the page in Polish and keeps the language on its links.
- A signed-in user cannot open the sign-up page.

### smoke

**home.spec.ts**
- Opens the employees page with a healthy backend.

**render-once.spec.ts**
- The page is never in the DOM twice while it loads, and the toast area exists.

**cv-flow.spec.ts**
- An admin signs in on the page, creates a CV, adds a skill and a project, and sees both in the preview. Every step uses the pages, not the API. The admin runs it because only an admin can read the project catalog (KAN-115).

### user-cvs

**user-cvs.spec.ts**
- Shows the four tabs, marks CVs and shows only the CVs of that user.
- CREATE CV makes the CV for this user, after the backend confirmed it.
- Edit saves the new name for the CV of this employee.
- Delete asks first, Cancel keeps the CV and Confirm removes it.
- The server rejects Edit and Delete of a CV of another employee than the tab's.
- View opens the CV, keeps the employee in its tabs, and the CVs breadcrumb returns to the tab.
- A return address to another site is ignored on the CV page.
- Has no CVs tab, and a direct link is sent back to Employees by the route rules.

### verify-email

**verify-email.spec.ts**
- Shows the title, the instruction, six boxes, CONFIRM, RESEND and LATER.
- Moves the focus to the next box while typing.
- Shows validation messages and sends nothing for an empty or incomplete code.
- A wrong code shows an error and keeps the digits.
- The code from the mail verifies the account, and it cannot be used again.
- LATER leads to the application without verifying.
- RESEND right after sign-up asks the user to wait and shows the countdown.
- A visitor who is not signed in is sent to the sign-in page.
- Shows the page in Polish and keeps the language on LATER.

## Stability check (KAN-121, 2026-11-19)

The full suite (157 test runs: 155 `test()` cases, and the 2 theme tests run once per theme) passed 3 runs in a row locally. Each run took about 48 seconds with 50% of the CPU cores as workers (10 on the test machine). One earlier run failed once: `user-cvs` "Delete asks first…" clicked the row menu while the confirm modal was still closing. The spec now waits for the modal to close.

CI runs `pnpm test:e2e` in the `e2e` job on a seeded database (1 worker, 2 retries). That CI run is not checked here.

## Known problems (found 2026-11-13, KAN-114)

- **`projects/projects.a11y.spec.ts` fails in a full run with one worker** (`the search field, CREATE PROJECT, the sort buttons and every row menu can be reached with Tab`, `only one row menu is open at a time`). It passes when run alone, and it fails the same on a clean `development` branch, so it does not come from the CV work. Probably a data left by an earlier spec; not investigated.

**Open note (KAN-94):** the `sign-up` spec failed once in a full `pnpm test-all` run under load, and passed 40 of 40 times alone. The cause is not found yet. Check it again before you trust a red `sign-up` run.

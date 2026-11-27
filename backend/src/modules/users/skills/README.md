# User skills

The skills of a user (PLAN.md S6.4, D13, D16): the Skills tab of User Details and the own Skills page. A user skill links a catalog skill to a user with a mastery level (`UserSkill`, unique `userId + skillId`). The CV skills page builds on it: only skills the CV owner has can go into a CV.

- **GraphQL:**
  - `userSkills(userId)` returns `[UserSkill]`: `id` (the link), `userId`, `skillId` (the catalog skill), `name`, `category { id name type }`, `mastery`, `createdAt`, `updatedAt`. The list is flat, sorted by category name, then skill name, then id; the page groups it by category (same shape as `cvSkills`). A user has few skills, so there is no paging.
  - `addUserSkill(input: { userId, skillId, mastery })` and `updateUserSkill(input: { id, mastery })` return the `UserSkill`. The skill of a link cannot change, only the mastery (page doc: the Skill field is disabled).
  - `removeUserSkills(input: { userId, ids })` returns `true`. 1 to 100 different link ids (`MAX_REMOVED_USER_SKILLS`).
- **No "available skills" query.** The Add modal takes the catalog from `skills` and hides the skills the user already has. The page doc calls that a UI optimization; the backend still refuses a duplicate.
- **Mastery:** `BEGINNER` to `EXPERT` (`USER_SKILL_MASTERY_LEVELS`). `NONE` is in the shared `Mastery` enum only for the skills of a CV, so a user skill refuses it (`BAD_USER_INPUT` on `mastery`). The mastery names of the Skills page doc (Novice, Competent…) are not used: PLAN.md §8 and the user skills page doc say Beginner to Expert.
- **Who:**
  - Reading: every signed-in user, for any user (an employee may view other profiles). No verified email needed.
  - Add, update, remove: the owner or an admin, with a verified email (D16, `@Verified()`, `FORBIDDEN` with `reason: "EMAIL_NOT_VERIFIED"`).
- **Checks, in this order** (the writes lock the actor and the user with `lockActorAndTarget(..., { ownerMayAct: true })` from `../user-lock.ts`, like `updateProfile` and the avatar, so an admin demoted at the same moment cannot still edit someone else):
  1. `FORBIDDEN`: neither the owner nor an admin. Also for an unknown user, so a user cannot probe which ids exist.
  2. `NOT_FOUND` "User not found": an admin sends an unknown user.
  3. The input: an unknown catalog skill → `BAD_USER_INPUT` with a field error on `skillId` ("Skill not found"), also when the skill is deleted between the check and the write (`P2003`).
- **Update:** the user is read from the link, so a link of another user cannot be changed by sending its id. Unknown link → `NOT_FOUND` "User skill not found". The CVs keep their own mastery: a CV skill has its own copy.
- **Remove (D13):** one transaction. It reads the links with `id in ids AND userId`; when one id is missing or belongs to another user, it answers `NOT_FOUND` and removes nothing. Then it removes the same catalog skills from **this user's** CVs (`CvSkill`) and the links. Other users, their CVs and the catalog skill stay.
- **Errors:**
  - The user already has the skill (unique index, `P2002`) → `CONFLICT` "The user already has this skill". It also covers two parallel adds.
  - The transaction was stopped (`P2034`) or timed out (`P2028`) → `CONFLICT` with `reason: "CONCURRENT_CHANGE"` (`toTransactionConflict`). Nothing was saved, so the client can try again.
- **Tests:** `*.spec.ts` next to the code; `backend/test/users/user-skills.int-spec.ts` runs every operation over HTTP against the test database (owner, other user, admin, unverified user, duplicates in parallel, removal from CVs).
- **Docs:** [User skills page](../../../../../docs/pages/12-user-skills-page.md) · [Skills page](../../../../../docs/pages/16-skills-page.md) · [PLAN.md S6.4, D13, D16](../../../../../PLAN.md)

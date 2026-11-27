# Languages module

The global languages catalog (PLAN.md S5.4, §7). Admin only.

- **GraphQL:**
  - `languages(search, sort, page)` returns a `LanguagePage` `{ items, total }` for the admin Languages page. Each `Language` has `id`, `name`, `iso` and `nativeName`. Search is on the name without regard to letter case; sort is by `name` or `iso` (any other field gives `BAD_USER_INPUT`), then by id.
  - `createLanguage(input: { name, iso, nativeName })` and `updateLanguage(input: { id, name, iso, nativeName })` return the `Language`. `deleteLanguage(id)` returns `true`.
- **Name (D35):** the input trims the name and turns each run of whitespace into one space (`NormalizeSpaces`). The column is `citext` with a `CHECK` of 100 characters (migration `20261123120000_languages_catalog_rules`), so "German" and "german" are the same name. The name keeps the letter case the admin typed. The migration stops if names or ISO codes already differ only in letter case ("English" / "english", "en" / "EN"): merge those rows first.
- **ISO code:** the input trims it and makes the letters a-z uppercase, then checks 1–5 characters of the letters A-Z with one optional hyphen (`EN`, `PT-BR`). A `CHECK` keeps the column uppercase, so the plain unique index also rejects "de" next to "DE".
- **Native name:** trimmed, required, at most 100 characters, not unique.
- **Errors:** the database is the guard, so there is no check before the write and no race.
  - Duplicate name (unique index, `P2002` on `name`) → `CONFLICT` "Language already exists"; duplicate ISO code (`P2002` on `iso`) → `CONFLICT` "ISO code already exists" with `reason: "ISO_TAKEN"` (D16), so the page shows it under the ISO field. Prisma gives only the index name, in an undocumented part of the error; if it is missing, the service asks the database whether another language has the ISO code. Saving an unchanged language, or only another letter case of its own name, is allowed.
  - Unknown language (`P2025`) → `NOT_FOUND` "Language not found".
  - Delete of a language in use (`P2003`) → `CONFLICT` "Language cannot be deleted because it is currently in use". In use (D18): a user has it (`UserLanguage`, `Restrict`).
- **Authorization:** `@Roles(Role.ADMIN)` on `LanguagesResolver`.
- **Tests:** `*.spec.ts` next to the code; `backend/test/languages/languages.int-spec.ts` runs every operation over HTTP against the test database.
- **Docs:** [Languages page (admin)](../../../../docs/pages/19-languages-page-admin.md) · [PLAN.md S5.4](../../../../PLAN.md)

## Notes

- **Migration order:** migration `20261123120000` has an older timestamp than `20261123130000_add_mastery_none`, which is in work on branch `fix/skill-mastery`. If that one merges first, a local `prisma migrate dev` can ask for a database reset. Use `prisma migrate deploy`, or rename the languages migration before the merge.
- **Seed match:** the seed in `catalogs.ts` finds a language by ISO code OR by name with `findFirst`. An admin can edit two seed languages so that one matches by ISO code and the other by name. Then the match is arbitrary.
- **Search:** `%`, `_` and `\` are escaped with `escapeLike` from `common/pagination`, so they search as plain characters.

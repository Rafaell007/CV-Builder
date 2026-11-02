# Auth module

Sign-in, sign-out and the current user. Sets the session cookies and registers the global sign-in guard (D9, D10).

- **GraphQL:** `signIn(input)` returns `SessionUser` and sets the cookies. `signOut` ends the session and clears the cookies. `me` returns `SessionUser` or `null`. All three are `@Public()`.
- **Cookies:** `access_token` (JWT, 15 min, holds only the user id) and `refresh_token` (random, 7 days). Both are `HttpOnly`, `SameSite=Lax`, and `Secure` in production.
- **Refresh token:** only its HMAC hash is stored in `RefreshToken`. `signOut` deletes the whole token family.
- **`JwtAuthGuard`:** global. Reads the access cookie, loads the user from the database and sets `request.user`. Without a valid session, only `@Public()` resolvers pass. It must run before `RolesGuard` and `VerifiedGuard`, so `AppModule` imports `AuthModule` before `ApiConventionsModule` (`app.module.spec.ts` checks this).
- **Errors:** wrong email or wrong password both give `UNAUTHENTICATED` with `Invalid email or password`.
- **Not done yet (S3.1b):** `refresh` with rotation, the 30 s grace window and family revoke (D21), and throttling (D23).
- **Tests:** `*.spec.ts` next to the code; `backend/test/auth.int-spec.ts` and `auth-guards.int-spec.ts` run over HTTP against the test database.
- **Docs:** [sign-in page](../../../../docs/pages/02-sign-in-page.md) · [PLAN.md D9, D10, D21](../../../../PLAN.md)

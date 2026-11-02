# Auth module

Sign-in, sign-out, token refresh and the current user. Sets the session cookies and registers the global sign-in guard (D9, D10).

- **GraphQL:** `signIn(input)` returns `SessionUser` and sets the cookies. `signOut` ends the session and clears the cookies. `refresh` swaps the refresh cookie for new cookies and returns `true`. `me` returns `SessionUser` or `null`. All four are `@Public()`. `signIn` is also throttled (see below).
- **Cookies:** `access_token` (JWT, 15 min, holds only the user id) and `refresh_token` (random, 7 days). Both are `HttpOnly`, `SameSite=Lax`, and `Secure` in production.
- **Refresh token:** only its HMAC hash is stored in `RefreshToken`. `signOut` deletes the whole token family.
- **`JwtAuthGuard`:** global. Reads the access cookie, loads the user from the database and sets `request.user`. Without a valid session, only `@Public()` resolvers pass. It must run before `RolesGuard` and `VerifiedGuard`, so `AppModule` imports `AuthModule` before `ApiConventionsModule` (`app.module.spec.ts` checks this).
- **Refresh (D21):** `refresh` marks the used token as replaced (`replacedAt`) and issues a new token in the same family (`familyId`). A replaced token works once more (`graceUsedAt`) inside 30 s (`REFRESH_GRACE_WINDOW_MS`), so a parallel request does not sign the user out. A second use inside the window, or any use after it, deletes the whole family. When the session has ended, `refresh` answers `UNAUTHENTICATED` and clears both cookies.
- **Throttling (D23):** `signIn` uses `GqlThrottlerGuard` from [common/throttling](../../common/throttling/README.md): `TOO_MANY_REQUESTS` after the limit. `signUp`, `forgotPassword`, `verifyEmail` and `resendVerificationCode` get the same guard when they are built.
- **Errors:** wrong email or wrong password both give `UNAUTHENTICATED` with `Invalid email or password`.
- **Tests:** `*.spec.ts` next to the code; `backend/test/auth.int-spec.ts`, `auth-guards.int-spec.ts`, `refresh.int-spec.ts` and `throttling.int-spec.ts` run over HTTP against the test database.
- **Docs:** [sign-in page](../../../../docs/pages/02-sign-in-page.md) · [PLAN.md D9, D10, D21](../../../../PLAN.md)

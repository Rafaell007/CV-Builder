# Session

How the frontend keeps a user signed in and decides who may open which route (PLAN D9, D10, §6). The backend owns the session: two httpOnly cookies, `access_token` (15 min) and `refresh_token` (7 days). JavaScript cannot read them. The checks here improve navigation; the backend still authorizes every request.

- **Route rules** (`getRouteKind`, `resolveRedirect`): pure functions. A route is `public`, `guest-only` (`/sign-in`, `/sign-up`), `protected` or `admin-only` (`/admin/*`, `/users/:id/cvs`). Unknown paths are public and show not-found. `/forgot-password` and `/reset-password` stay public for everyone (PLAN §6).
- **`src/proxy.ts`** calls `handleRequest` from `@/server/session`, on every page request: no session → `/sign-in`; signed in on `/sign-in` or `/sign-up` → `/users`; a user on an admin-only route → `/users`. If the access token has expired, it calls `refresh` first and hands the new cookies to the page being rendered and to the browser. The role is read with `me` only for admin-only routes, because the access token holds just the user id. If the backend cannot be reached or does not answer within 5 seconds, the request passes and nobody is signed out; cookies a refresh already issued still go to the browser. If the backend refuses a token that looks fresh (deleted user, rotated secret), the session is over: both cookies are cleared and the visitor goes to `/sign-in`. Refreshes with one refresh token share one call, and the answer of a finished refresh is reused for 5 seconds, because the backend ends the session when a token is used more than twice (D21). The store is in memory, so it is per server instance.
- **`refreshSession`**: browser refresh through the frontend's own `/graphql`, single-flight. Answers `refreshed`, `rejected` (session over) or `failed` (network; nobody is signed out).
- **`redirectToSignIn`**: full page load to `/sign-in`, once. It returns `true` when the redirect is under way and `false` when it did nothing. It does nothing when the user is already on `/sign-in`, so a failing query there cannot cause a reload loop.
- **Apollo:** `createSessionLink` in [`@/shared/apollo`](../apollo/README.md) uses `refreshSession` and `redirectToSignIn`.
- **Current user:** [`useCurrentUser`](../currentUser/README.md).

`SESSION_OPERATIONS` (`SignIn`, `SignOut`, `Refresh`) never trigger a refresh. Name your sign-in and sign-out operations like that.

Docs: [Next.js proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) · [PLAN D9, D21](../../../../PLAN.md)

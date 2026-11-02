# Session

How the frontend keeps a user signed in and decides who may open which route (PLAN D9, D10, §6). The backend owns the session: two httpOnly cookies, `access_token` (15 min) and `refresh_token` (7 days). JavaScript cannot read them. The checks here improve navigation; the backend still authorizes every request.

- **Route rules** (`getRouteKind`, `resolveRedirect`): pure functions. A route is `public`, `guest-only` (`/sign-in`, `/sign-up`), `protected` or `admin-only` (`/admin/*`, `/users/:id/cvs`). Unknown paths are public and show not-found. `/forgot-password` and `/reset-password` stay public for everyone (PLAN §6).
- **`src/proxy.ts`** calls `handleRequest` from `@/server/session`, on every page request: no session → `/sign-in`; signed in on `/sign-in` or `/sign-up` → `/users`; a user on an admin-only route → `/users`. If the access token has expired, it calls `refresh` first and hands the new cookies to the page being rendered and to the browser. The role is read with `me` only for admin-only routes, because the access token holds just the user id. If the backend cannot be reached, the request passes and nobody is signed out. Refreshes that run at the same time with one refresh token share one call, because the backend ends the session when a token is used more than twice (D21).
- **`refreshSession`**: browser refresh through the frontend's own `/graphql`, single-flight. Answers `refreshed`, `rejected` (session over) or `failed` (network; nobody is signed out).
- **`redirectToSignIn`**: full page load to `/sign-in`, once.
- **Apollo:** `createSessionLink` in [`@/shared/apollo`](../apollo/README.md) uses `refreshSession` and `redirectToSignIn`.
- **Current user:** [`useCurrentUser`](../currentUser/README.md).

`SESSION_OPERATIONS` (`SignIn`, `SignOut`, `Refresh`) never trigger a refresh. Name your sign-in and sign-out operations like that.

Docs: [Next.js proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) · [PLAN D9, D21](../../../../PLAN.md)

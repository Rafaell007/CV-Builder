# Session (server)

`handleRequest` (called from `src/proxy.ts`) runs on every page request and decides between the page, a refresh and a redirect to sign-in. `resolveSession` and `postGraphql` support it.

`src/proxy.ts` only passes the request and the backend origin to `handleRequest` and sets the `matcher` (which paths the proxy sees: pages, not `/graphql`, `/api`, `/_next` or asset files). Its test `src/proxy.test.ts` stays beside it, because Next.js needs the file at that path (an exception to the folder rule of `frontend/AGENTS.md`).

- **Known limit (KAN-94):** the proxy only checks that the session cookies exist, not that the session is still valid. After a password change on another device, an ended session still opens pages that make no protected query. Its first protected data request fails with `UNAUTHENTICATED` and sends the user to sign-in. Fix when needed: let the proxy ask the backend (`me`) before it serves a page.

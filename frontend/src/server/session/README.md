# Session (server)

`handleRequest` (called from `src/proxy.ts`) runs on every page request and decides between the page, a refresh and a redirect to sign-in. `resolveSession` and `postGraphql` support it.

`src/proxy.ts` only passes the request and the backend origin to `handleRequest` and sets the `matcher` (which paths the proxy sees: pages, not `/graphql`, `/api`, `/_next` or asset files). Its test `src/proxy.test.ts` stays beside it, because Next.js needs the file at that path (an exception to the folder rule of `frontend/AGENTS.md`).

- **Cookies to the browser (KAN-172):** `handleRequest` hands the cookies the backend issued or cleared to the browser through `response.cookies` (`toResponseCookies` parses them with their attributes), never as raw `Set-Cookie` headers. On a page that is streamed after its static shell (Partial Prerendering: the protected pages, PLAN D6), Next.js drops raw headers and keeps only `response.cookies`, so a refreshed session would never reach the browser.
- **Session check (KAN-162):** when the access token looks fresh, the proxy still asks the backend (`me`) before it serves a page. An ended session (for example after a password change on another device) goes to sign-in on the next page load. This costs one extra backend request per page request, and Next.js prefetches count too. No request is sent after a refresh, unless the route needs the role. If the cost matters, cache the `me` answer for a few seconds per access token.

# Current user

- `useCurrentUser()` → `{ user, loading, failed, retry, isAdmin }`. `failed` is true when the `me` request failed (not when nobody is signed in); `retry` sends it again. `user` is the `me` query's `SessionUser`, or `null` while loading and when nobody is signed in. Client Components only.
- Use it for the layout (sidebar by role, profile menu) and to hide what the user may not do. It is not a security check: the backend decides (PLAN D10).
- Server render (KAN-172): a route that needs the role in its server HTML prefetches `me` with `<PrefetchQuery query={MeDocument}>` (`@/shared/apollo/server`). `useCurrentUser` then has the user during the server render, not `loading`. Done by `/users`, `/cvs` and the `/admin` layout. The sidebar is outside those routes, so it still loads the user in the browser.

Used by: the `(app)` layout from S1.4. Session handling is in [`@/shared/session`](../session/README.md).

Docs: [PLAN §6](../../../../PLAN.md)

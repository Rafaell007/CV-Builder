# Current user

- `useCurrentUser()` → `{ user, loading, isAdmin }`. `user` is the `me` query's `SessionUser`, or `null` while loading and when nobody is signed in. Client Components only.
- Use it for the layout (sidebar by role, profile menu) and to hide what the user may not do. It is not a security check: the backend decides (PLAN D10).

Used by: the `(app)` layout from S1.4. Session handling is in [`@/shared/session`](../session/README.md).

Docs: [PLAN §6](../../../../PLAN.md)

# Health

Temporary demo of the Apollo setup (PLAN S0.4, KAN-68). It shows the backend `health` query twice: from a Server Component (`ServerHealth`, `query()`) and from a Client Component (`ClientHealth`, `useSuspenseQuery`, preloaded on the server with `<PreloadQuery>`).

- Exports: `HealthCheck` (Server Component; render it inside `<Suspense>`).
- Used by: the `/users` placeholder page. Remove it when the users page is built (S6).
- Setup: [shared/apollo/README.md](../../shared/apollo/README.md).

# Apollo

Apollo Client 4 with the Next.js App Router integration (PLAN D6, D8). Operations and their types come from `@/shared/graphql` (codegen).

- `@/shared/apollo` → `ApolloClientProvider`: wraps the app in `app/layout.tsx`. Client Components then use the hooks from `@apollo/client/react`. Requests go to the frontend's own `/graphql`, which Next.js rewrites to the backend, so the browser sends the auth cookies itself.
- `@/shared/apollo/server` → `query`, `getClient`, `PreloadQuery`: for Server Components. A new client per request calls `BACKEND_URL` directly and forwards the request's cookies (`cookieLink`). The data is per request, so a Server Component that queries starts with `await connection()` (from `next/server`) and is rendered inside `<Suspense>`; otherwise Cache Components tries to prerender it at build time and the build fails. `PreloadQuery` fetches on the server and hands the result to a Client Component's `useSuspenseQuery`, so protected data never needs cookies in the browser bundle.
- `errorLink`: shared by both clients; logs GraphQL and network errors.
- `createSessionLink`: browser client only. A request that fails with `UNAUTHENTICATED` triggers one session refresh (`refreshSession`, single-flight), then runs again once. If the refresh is refused, or the second run fails the same way, it redirects to `/sign-in`. A network error during the refresh signs nobody out. `SignIn`, `SignOut` and `Refresh` are skipped. On the server the proxy has refreshed the session already (see [session](../session/README.md)).
- `networkErrorLink`: browser client only. A **query** that cannot reach the server (fetch failed, or a 5xx status) calls `markQueryFailed()` from [network](../network/README.md), so the No Internet screen shows. Mutations, 4xx and GraphQL errors are ignored. It runs before the session link, so it sees only the final error.

Docs: [Apollo, Next.js App Router](https://www.apollographql.com/docs/react/integrations/nextjs), [Apollo Client 4 migration](https://www.apollographql.com/docs/react/migrating/apollo-client-4-migration).

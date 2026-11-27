# Throttling

Rate limit for public operations that can be abused, such as `signIn` (D23).

- **Exports:** `GqlThrottlerGuard`, `ThrottlingModule`.
- **Use:** import `ThrottlingModule` in the feature module, then add `@UseGuards(GqlThrottlerGuard)` to the resolver method. The stock `ThrottlerGuard` does not work for GraphQL, because it reads the HTTP request. `GqlThrottlerGuard` reads the request through `getRequest()` from `common/auth`, so it also works on a REST controller method.
- **Limit:** `THROTTLE_LIMIT` calls in `THROTTLE_TTL_SECONDS` seconds (defaults: 10 and 60), counted per client IP and per operation. Over the limit, the error is `TOO_MANY_REQUESTS`.
- **Storage:** in memory, so the counters reset when the server restarts and are not shared between server instances. The client IP is `req.ip`. Behind a proxy, set `TRUST_PROXY_HOPS` (applied in `src/configure-app.ts`), or every user shares the proxy IP. With the default 0, `X-Forwarded-For` is ignored, so a client cannot fake a new IP.
- **REST:** `POST` and `DELETE /api/users/:id/avatar` use it too (KAN-181).
- **Tests:** `gql-throttler.guard.spec.ts`; `backend/test/auth/throttling.int-spec.ts` and `backend/test/users/avatar-throttling.int-spec.ts` lower the limit to 3; `backend/test/app/trust-proxy.int-spec.ts` checks that each client IP is counted on its own behind a proxy.
- **Docs:** [PLAN.md D23](../../../../PLAN.md)

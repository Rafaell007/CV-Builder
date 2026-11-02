# Throttling

Rate limit for public operations that can be abused, such as `signIn` (D23).

- **Exports:** `GqlThrottlerGuard`, `ThrottlingModule`.
- **Use:** import `ThrottlingModule` in the feature module, then add `@UseGuards(GqlThrottlerGuard)` to the resolver method. The stock `ThrottlerGuard` does not work for GraphQL, because it reads the HTTP request.
- **Limit:** `THROTTLE_LIMIT` calls in `THROTTLE_TTL_SECONDS` seconds (defaults: 10 and 60), counted per client IP and per operation. Over the limit, the error is `TOO_MANY_REQUESTS`.
- **Storage:** in memory, so the counters reset when the server restarts and are not shared between server instances. Behind a proxy, set Express `trust proxy`, or every user shares the proxy IP.
- **Tests:** `gql-throttler.guard.spec.ts`; `backend/test/throttling.int-spec.ts` lowers the limit to 3.
- **Docs:** [PLAN.md D23](../../../../PLAN.md)

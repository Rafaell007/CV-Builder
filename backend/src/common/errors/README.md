# Errors

Gives every GraphQL error a stable `extensions.code` (D7). The frontend reads these codes.

- **Exports:** `GraphQLExceptionFilter`, `ErrorCode`, `ValidationFailedException`, `FieldError`.
- **Mapping:** see the table in the [backend README](../../../README.md#3-throw-errors). An unknown error is logged and returned as `INTERNAL_SERVER_ERROR` without details.
- **Prisma:** `P2002` becomes `CONFLICT` and `P2025` becomes `NOT_FOUND`, with a fixed message (the Prisma text names tables and columns).
- **HTTP:** a request that is not GraphQL (for example an unknown route) gets Nest's normal JSON error, because the filter extends `BaseExceptionFilter`.
- **Reason:** a `ForbiddenException` can carry `reason` (for example `EMAIL_NOT_VERIFIED`). The filter adds it to `extensions`.
- **Registered by:** `ApiConventionsModule`.
- **Docs:** [PLAN.md D7](../../../../PLAN.md)

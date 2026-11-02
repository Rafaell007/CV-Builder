# Errors

Gives every GraphQL error a stable `extensions.code` (D7). The frontend reads these codes.

- **Exports:** `GraphQLExceptionFilter`, `ErrorCode`, `ValidationFailedException`, `FieldError`.
- **Mapping:** see the table in the [backend README](../../../README.md#3-throw-errors). An unknown error is logged and returned as `INTERNAL_SERVER_ERROR` without details.
- **Reason:** a `ForbiddenException` can carry `reason` (for example `EMAIL_NOT_VERIFIED`). The filter adds it to `extensions`.
- **Registered by:** `ApiConventionsModule`.
- **Docs:** [PLAN.md D7](../../../../PLAN.md)

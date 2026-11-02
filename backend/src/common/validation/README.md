# Validation

The global `ValidationPipe`. It checks every `@InputType` and `@ArgsType` with class-validator.

- **Exports:** `createValidationPipe`, `flattenValidationErrors`.
- **Result:** invalid input throws `ValidationFailedException`. The client gets `BAD_USER_INPUT` with `fieldErrors`: `{ field, messages }`. A nested field has a dotted path, for example `page.size`.
- **Settings:** `transform: true` (resolvers get class instances) and `whitelist: true` with `forbidNonWhitelisted: true` (a property without a validator fails with `BAD_USER_INPUT` instead of being dropped).
- **Rule:** every `@Field()` on an `@InputType` or `@ArgsType` needs at least one class-validator decorator. `@IsOptional()` counts.
- **Registered by:** `ApiConventionsModule`.
- **Docs:** [PLAN.md §9 S2.2](../../../../PLAN.md)

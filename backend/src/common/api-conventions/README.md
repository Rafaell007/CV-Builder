# API conventions

One module that turns the shared API rules on for the whole backend.

- **Exports:** `ApiConventionsModule`.
- **Registers:** the validation pipe, the exception filter, `RolesGuard` and `VerifiedGuard`, all global.
- **Used by:** `AppModule`. Feature modules do not import it.
- **Test:** `api-conventions.spec.ts` runs a sample module with pagination, field errors and guards over HTTP, without a database.
- **Docs:** [PLAN.md §9 S2.2](../../../../PLAN.md)

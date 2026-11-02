# Auth decorators and guards

The skeleton of backend authorization (D10). Sign-in itself (JWT, cookies) comes in Phase 3.

- **Exports:** `@Public()`, `@Roles(...)`, `@Verified()`, `@CurrentUser()`, `RolesGuard`, `VerifiedGuard`, `EmailNotVerifiedException`, `AuthUser`.
- **How it works:** the guards read `request.user`. The sign-in guard (S3.1) sets it. Without a user, `@Roles` and `@Verified` answer `UNAUTHENTICATED`.
- **Not done yet:** the global `JwtAuthGuard` that uses `@Public()`. Nothing reads `@Public()` until S3.1.
- **Order:** S3.1 must register `JwtAuthGuard` before `RolesGuard` and `VerifiedGuard`, so that `request.user` exists.
- **Registered by:** `ApiConventionsModule`.
- **Docs:** [PLAN.md D10, D16](../../../../PLAN.md)

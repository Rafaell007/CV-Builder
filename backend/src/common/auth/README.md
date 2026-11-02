# Auth decorators and guards

The shared parts of backend authorization (D10). Sign-in itself (JWT, cookies, `JwtAuthGuard`) is in [modules/auth](../../modules/auth/README.md).

- **Exports:** `@Public()`, `@Roles(...)`, `@Verified()`, `@CurrentUser()`, `IS_PUBLIC_KEY`, `RolesGuard`, `VerifiedGuard`, `EmailNotVerifiedException`, `AuthUser`.
- **How it works:** the guards read `request.user`. `JwtAuthGuard` (modules/auth) sets it. Without a user, `@Roles` and `@Verified` answer `UNAUTHENTICATED`.
- **Order:** `JwtAuthGuard` runs first, then `RolesGuard`, then `VerifiedGuard`. `AppModule` imports `AuthModule` before `ApiConventionsModule` to get this order.
- **Registered by:** `RolesGuard` and `VerifiedGuard` by `ApiConventionsModule`.
- **Docs:** [PLAN.md D10, D16](../../../../PLAN.md)

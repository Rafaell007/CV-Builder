# Failures

One place that reads why a GraphQL request failed (KAN-168).

- `readFailure(error)`: returns `{ kind, reason? }`. `kind` is `notFound`, `forbidden`, `conflict`, `invalid`, `unauthenticated`, `tooManyRequests` or `unknown`. `reason` is the backend `extensions.reason` of the error that decided the kind (for example `ISO_TAKEN`).
- The order when a response holds several codes: `NOT_FOUND`, `FORBIDDEN`, `CONFLICT`, `BAD_USER_INPUT`, `UNAUTHENTICATED`, `TOO_MANY_REQUESTS`. `notFound` wins first, so a user cannot learn which ids exist. The throttler answers before the service runs, so `tooManyRequests` never shares a response with a service error for the same field; it is last for that reason (KAN-169, tested in `readFailure.test.ts`).
- `unauthenticated` is for sign-in (wrong credentials). `shared/apollo/sessionLink` skips `SignIn`, and it handles an ended session for every other request, so the other features treat this kind as `unknown`.
- Network and server errors are `unknown`.
- The module returns no text. Each feature maps the kind to its own translated text, and treats the kinds it does not support as `unknown` at its own call site. The meaning of a `reason` belongs to the feature (for example `ISO_TAKEN_REASON` in Languages).

Used by: Users, CVs, CV skills, CV projects, catalogs, Languages and the auth forms (sign-in, sign-up, verify email, forgot password, reset password, change password).

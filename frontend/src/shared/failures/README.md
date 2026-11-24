# Failures

One place that reads why a GraphQL request failed (KAN-168).

- `readFailure(error)`: returns `{ kind, reason? }`. `kind` is `notFound`, `forbidden`, `conflict`, `invalid` or `unknown`. `reason` is the backend `extensions.reason` of the error that decided the kind (for example `ISO_TAKEN`).
- The order when a response holds several codes: `NOT_FOUND`, `FORBIDDEN`, `CONFLICT`, `BAD_USER_INPUT`. `notFound` wins first, so a user cannot learn which ids exist.
- Network and server errors are `unknown`.
- The module returns no text. Each feature maps the kind to its own translated text, and treats the kinds it does not support as `unknown` at its own call site. The meaning of a `reason` belongs to the feature (for example `ISO_TAKEN_REASON` in Languages).

Used by: CVs, CV skills, CV projects, catalogs and Languages.

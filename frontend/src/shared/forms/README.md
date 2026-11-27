# Forms

Helpers for forms built with React Hook Form + Zod (PLAN §2.2) and for the server's field errors (PLAN D7).

- `useZodForm(schema, options)`: `useForm` with `zodResolver(schema)` and `mode: "onTouched"` (error after the field is left, then live while typing). The submit handler gets the schema's output. Build the schema with translated messages in the form's hook.
- `applyServerFieldErrors(error, setError, { fields, getMessage })`: puts the `BAD_USER_INPUT` field errors of a failed request under the matching fields and focuses the first. The text comes from `getMessage(field, reasons)` (translated), never the server's English message. `reasons` is the list of stable codes that the server sent for the field, or an empty list. Returns `false` when a general error is needed too.
- `useServerForm(schema, { defaultValues, serverFields, placeFailure? })`: a Zod form that sends to the server. It owns the form (`useZodForm`), the guard against a double submit, the one general error (`failed`, plus the form's own keys) and the placement of a failed request. Returns `{ form, generalError, reset, showError, submit(event, send) }`. An error that `send` throws goes to `showError`, so `send` needs no `try/catch` of its own (KAN-186). A flow that still catches itself must call `showError`. `placeFailure(failure)` is a pure function from the `readFailure` result to where the failure shows: under one field (`field`), as the general error only (`general`), or as the server field errors with a fallback general error (`fieldErrors`). Without it, every failure is `fieldErrors` with `failed`, and `readFailure` is not called. A form with extras (`hasChanged`, a boolean `failed`) derives them from `generalError` in its own hook. Do not copy the guard into a new form (KAN-183).
- `getServerFieldErrors(error)`: the raw `{ field, messages, reasons? }` list, shape-checked; empty for any other error. `reasons` is optional, one code for each message (the backend README, section Errors). A `reasons` value that is not a list of texts is dropped and the field error stays.

Fields that get `shouldFocus` need a ref on a focusable element: `register()` does it for inputs; controlled fields (`Controller`) pass `field.ref` to the component.

Used by: every form with server validation. Reference: `SampleForm.stories.tsx` (Storybook "Forms/Sample form"): every field wired with `register` or `Controller`, client errors, and a mocked `BAD_USER_INPUT` shown under the fields. Backend side: `backend/src/common/validation/README.md`. Docs: [React Hook Form](https://react-hook-form.com/docs/useform), [resolvers](https://github.com/react-hook-form/resolvers#zod), [Zod](https://zod.dev/).

## Known issues (found in the KAN-78 review)

- No `Controller` wrapper. Every form wires `Controller` by hand (see `SampleForm.stories.tsx`). Add one when a third form repeats the same code.
- `applyServerFieldErrors` focuses only the first server error. A server error on a field that is not in the `fields` list is not shown inline. It returns `false`, so the caller must show a general error.
- No helper translates Zod messages (PLAN.md has the i18n rule). The caller translates them.

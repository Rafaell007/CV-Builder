# Forms

Helpers for forms built with React Hook Form + Zod (PLAN §2.2) and for the server's field errors (PLAN D7).

- `useZodForm(schema, options)`: `useForm` with `zodResolver(schema)` and `mode: "onTouched"` (error after the field is left, then live while typing). The submit handler gets the schema's output. Build the schema with translated messages in the form's hook.
- `applyServerFieldErrors(error, setError, { fields, getMessage })`: puts the `BAD_USER_INPUT` field errors of a failed request under the matching fields and focuses the first. The text comes from `getMessage` (translated), never the server's English message. Returns `false` when a general error is needed too.
- `getServerFieldErrors(error)`: the raw `{ field, messages }` list, shape-checked; empty for any other error.

Fields that get `shouldFocus` need a ref on a focusable element: `register()` does it for inputs; controlled fields (`Controller`) pass `field.ref` to the component.

Used by: every form with server validation. Reference: `SampleForm.stories.tsx` (Storybook "Forms/Sample form"): every field wired with `register` or `Controller`, client errors, and a mocked `BAD_USER_INPUT` shown under the fields. Backend side: `backend/src/common/validation/README.md`. Docs: [React Hook Form](https://react-hook-form.com/docs/useform), [resolvers](https://github.com/react-hook-form/resolvers#zod), [Zod](https://zod.dev/).

# FormModal

`Modal` with a form, for every create and update modal (e.g. Add skill, Update skill). It only displays the form's state; the caller's hook owns the form (React Hook Form + Zod via `useZodForm`).

- The submit button is disabled until `canSubmit`: pass `formState.isValid && formState.isDirty`.
- `isSubmitting` shows the button's loading state; a second click or Enter is ignored, and CANCEL, ×, Escape and the overlay do not close the modal while a request runs.
- Close the modal (`onOpenChange(false)`) only after a successful request. A failed request keeps the values, because nothing resets the form; show its field errors with `applyServerFieldErrors` (`@/shared/forms`).
- Reset the form when the modal opens (`form.reset(values)` in the opener's click handler), so a new open never shows an old attempt.
- The first field gets focus on open. When the modal closes, focus returns to the element that opened it.
- Fields go in as `children`; they are 36px apart. CANCEL and the submit button are in the footer and join the form through the HTML `form` attribute.

Used by: the CRUD pages' create and update modals. Reference: `FormModal.stories.tsx` (Storybook "Shared/FormModal"). Docs: [docs/pages/12-user-skills-page.md](../../../../../docs/pages/12-user-skills-page.md) (Add Skill Modal), [Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog).

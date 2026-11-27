# FormModal

`Modal` with a form, for every create and update modal (e.g. Add skill, Update skill). It only displays the form's state; the caller's hook owns the form (React Hook Form + Zod via `useServerForm`).

- The submit button is disabled until `canSubmit`: pass `formState.isValid && formState.isDirty`.
- `isSubmitting` shows the button's loading state; a second click or Enter is ignored, and CANCEL, ×, Escape and the overlay do not close the modal while a request runs.
- Close the modal (`onOpenChange(false)`) only after a successful request. A failed request keeps the values, because nothing resets the form; show its field errors with `applyServerFieldErrors` (`@/shared/forms`).
- Reset the form when the modal opens (`form.reset(values)` in the opener's click handler), so a new open never shows an old attempt.
- The first field gets focus on open. When the first field is a date field (`data-date-picker`), the form itself gets the focus (`tabIndex={-1}`, no ring) instead: no field has a cursor, no date is selected, and the first Tab reaches the date field. Focusing a date field never opens its calendar (Enter, an arrow or a click does). In a text field nothing is selected: a row menu that opened the modal returns the focus to its button, the focus trap pulls it back with `select()`, and the hook puts the cursor at the end again (`keepSelectionCollapsed`). This guard ends at the first key or pointer press, after one second at most, or when the modal closes or unmounts, so a selection the user makes (double-click, Ctrl+A) stays. When the modal closes, focus returns to the element that opened it.
- `initialFocus="form"` keeps the focus on the form itself on open (same invisible focus as for a date field), whatever the first field is. Use it when the first field is disabled while it loads (Add skill: the Skill field waits for its options). Without it, the focus jumps to the next enabled field and its focus border shows, so a field looks focused that the user never touched. The first Tab then reaches the first enabled field. Default: `"firstField"`.
- Fields go in as `children`; they are 36px apart. CANCEL and the submit button are in the footer and join the form through the HTML `form` attribute.

Used by: the CRUD pages' create and update modals. Reference: `FormModal.stories.tsx` (Storybook "Shared/FormModal"). Docs: [docs/pages/12-user-skills-page.md](../../../../../docs/pages/12-user-skills-page.md) (Add Skill Modal), [Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog).

# Delete CV (KAN-112)

This section is for `README.md`. The integration step merges it there and then deletes this file.

- Delete: `Delete` in the row menu opens `components/DeleteCvModal` (the shared `ConfirmModal`): `Are you sure you want to delete CV {name}?` with the name in bold, `Confirm` and `Cancel`. `useDeleteCv` holds the chosen CV and sends the `deleteCv` mutation (`useDeleteCv/deleteCv.graphql`). Texts: `messages/` (`cvs.delete`, `en` and `pl`). Page document: [docs/pages/20-cvs-page.md](../../../../docs/pages/20-cvs-page.md), section Delete CV (AC-30 to AC-36, AC-39).
- Exports (not yet wired into a page): `useDeleteCv()` returns `{ cv, pending, askToDelete(cv), cancel(), confirm() }`; `DeleteCvModal({ cv, pending, onConfirm, onCancel })`; `toDeleteCvFailure(error)` in `utils`.
- While the request runs, CONFIRM shows its loading state and a second press sends nothing (the hook and `ConfirmModal` both block it).
- Success: the CV leaves the Apollo cache (the row goes at once), the `Cvs` query loads again for the new total, the modal closes. `confirm` resolves `true` after a successful delete, `false` otherwise. The page must go back one page when the user deletes the only CV on page 2 or later (as `Projects.tsx` does in `handleConfirmDelete`).
- The modal keeps the last CV name while it fades out. Vitest cannot see the fade (jsdom has no animation).
- Failure: the modal closes and an error toast shows the reason. The toast stays behind an open modal where a keyboard user cannot reach it, so the modal closes first.
  - `NOT_FOUND` (the CV is deleted, or it belongs to another user; the backend gives the same answer): the text `This CV does not exist any more. The list was updated.` The hook also loads the `Cvs` query again.
  - `FORBIDDEN`: the text `You are not allowed to delete this CV.`
  - Any other failure (network, server): `Something went wrong. Please try again.`
  - The backend message is never shown. `utils/toDeleteCvFailure` returns `notFound`, `forbidden` or `undefined`, and the hook picks the translated text.
- Who may delete (AC-32, AC-33, AC-34): the backend decides. A user deletes only their own CVs, an admin any CV. The frontend shows `Delete` for every row it receives, because the list already holds only rows the user may see.

## Notes

- The `NOT_FOUND` reload is not covered by a test: the hook test has no active `Cvs` query. Cover it in the page test when the hook is wired in.
- `useDeleteCv/deleteCv.mocks.ts` holds the mocks of this flow. The list agent may add a `cvs.mocks.ts` with its own fixture; join the two when both are merged.
- `utils/index.ts` and `messages/*.json` can conflict with the same files of the list work. Keep both sets of exports and keys.
- No Storybook story yet. Add one with the page stories.
- The fade-out of the modal and the real backend were not checked in a browser.

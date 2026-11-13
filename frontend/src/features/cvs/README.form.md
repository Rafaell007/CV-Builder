# CVs: Create and Update (form part)

This file holds the Create and Update sections for `README.md`. The integration step merges it there and deletes this file.

## Create CV and Update CV

Spec: [docs/pages/20-cvs-page.md](../../../../docs/pages/20-cvs-page.md), sections Create CV and Update CV.

The modals work alone. They are not yet plugged into the list page. The page owns one hook per modal and passes it to the modal.

| Export                        | Purpose                                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `useCreateCvForm()`           | Open state, form, submit and general error of Create CV. Returns `{ form, isOpen, open, setOpen, submit, failed }`. |
| `useUpdateCvForm()`           | The same shape. `open(cv: CvListItem)` fills the form with the CV.                                                  |
| `CreateCvModal({ creation })` | Title Create CV, buttons CANCEL and CREATE.                                                                         |
| `UpdateCvModal({ update })`   | Title Update CV, buttons CANCEL and SAVE. The fields hold the data of the CV.                                       |

Internal parts:

- `useCreateCv` and `useUpdateCv`: the `createCv` and `updateCv` requests. After success they load the open `Cvs` query again.
- `useCvForm`: React Hook Form with Zod. It holds the rules, blocks a double submit and shows server errors.
- `utils/cvForm.utils.ts`: `cvFormSchema` and the functions that make the request inputs.
- `components/CvFormFields`: Name, Education and Description fields. The modals do not repeat them.
- `cvForm.mocks.ts`: Apollo mocks and sample data for the tests.
- `messages/`: keys `cvs.form`, `cvs.create` and `cvs.update`.

Rules (the same in the backend):

- Name: required, 255 characters at most. Education: required, 255 characters at most. Description: required, 2000 characters at most. Text is trimmed.
- CREATE and SAVE are enabled only when the form is valid and the user changed it.
- A failed request keeps all values. A `BAD_USER_INPUT` error shows under its field. Other errors show one message in the modal.
- Success: the modal closes and a toast shows.

How to plug in (integration step):

```tsx
const creation = useCreateCvForm();
const editing = useUpdateCvForm();
// CREATE CV button: creation.open()   Edit action of a row: editing.open(cv)
<CreateCvModal creation={creation} />
<UpdateCvModal update={editing} />
```

## Notes

- The Create form sends no `userId`. The backend uses the signed-in user. An admin cannot choose another owner in this form.
- `cvForm.mocks.ts` is separate from the list mocks (`cvs.mocks.ts`) to avoid a merge conflict. The integration step can merge them.
- The `cvs` messages are registered in `src/i18n/loadMessages`. Merge with the list agent line if both add it.

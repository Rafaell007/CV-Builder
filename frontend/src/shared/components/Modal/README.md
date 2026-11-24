# Modal

A controlled dialog on Radix `Dialog`: title, optional description, close button, content and a footer for buttons.

- Export: `Modal` and `ModalProps`. Used by `FormModal`, `ConfirmModal` and the project forms.
- Focus is trapped inside; Escape, a click on the overlay and the close button call `onOpenChange(false)`. `useReturnFocus` returns the focus to the element that opened it.
- One Escape closes one layer (KAN-138). Radix hears Escape on the document before the focused field does. The `Modal` therefore ignores an Escape that comes from inside an element with `data-calendar-open`, which `DatePicker` sets while its calendar is open. The calendar closes itself, and a second Escape closes the modal. A new popup in a modal must set the same attribute.
- The dialog is centred with `inset: 0` and `margin: auto`, not with `transform`. A transform would make a `position: fixed` popup inside the modal follow the modal and be cut by its scroll area. Do not add `transform`, `filter` or `contain` to `.content`.
- `size="wide"`: 860px from 1024px up (Create user, two fields per row); below 1024px it is 620px like the default. `FormModal` passes `size` through.
- Tests: `Modal.test.tsx` (includes Escape with a `DatePicker` inside). Values: `docs/design-tokens.md` > Modal.

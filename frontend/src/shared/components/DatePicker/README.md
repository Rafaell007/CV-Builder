# DatePicker

A date field with a calendar popup: [react-datepicker](https://github.com/Hacker0x01/react-datepicker) (PLAN §2.2) with our `Field` as its input, our own calendar header and our own CSS (the library's CSS is not loaded).

- Export: `DatePicker` (props: `label`, `value: Date | null`, `onValueChange`, `onBlur`, `ref`, `locale`, `labels`, `minDate`, `maxDate`, `name`, `helperText`, `error`, `disabled`, `required`) and the types `DatePickerProps`, `DatePickerLabels`.
- Controlled only. With React Hook Form, wrap it in a `Controller` and pass `field.value`, `field.onChange`, `field.onBlur` and `field.ref`.
- `locale` is the app language. The date-fns locale (`datePicker.constants.ts`) gives month and weekday names, the first day of the week and the short date format, used to show and to parse typed dates. `en` is British English: US English names days with ordinals ("November 4th"), which fails axe.
- `labels`: the screen-reader texts, translated by the caller. react-datepicker's own texts are English only. The popup's name comes through `CalendarDialog` (a custom `calendarContainer`) and `CalendarLabelContext`.
- Calendar: month and year buttons switch to a month list or a year list (`useDatePicker` keeps the view). A year leads to its months, a month to its days, and a day sets the value and closes the calendar.
- Keyboard: typing a date works. The first Arrow Down moves into the calendar, then the arrows move by day or week, and Enter picks. Escape closes.
- `onBlur` runs only when focus leaves the field and its calendar. Mouse clicks in the calendar keep focus in the input (see `CalendarDialog`).
- The popup sits under the field, not in a portal: inside a clipping container (`overflow: hidden`), give it room.
- Used by: project and CV project forms (start and end dates). Values: [docs/design-tokens.md › Date picker](../../../../../docs/design-tokens.md#date-picker-ds).

## Known issues (found in the KAN-78 review)

- No way to clear the date with a button. The End Date is optional on [docs/pages/23](../../../../../docs/pages/23-cv-projects-page.md), so a user must delete the text by hand. Add a clear control when that page is built.
- No example or test of a start and end date pair linked with `minDate` and `maxDate`. Add one when the project forms are built.
- A typed text that is not a date sets the value to `null` without an error message. The form (Zod) must report a missing date.
- The calendar is 449px wide and shrinks to the screen width minus 2 × 16px on a narrow phone. The inner layout (header, grid) is not checked at phone width. Check it when the mobile layout is designed.
- The month list, the year list and the 12-year paging are not in the design (see [docs/design-tokens.md](../../../../../docs/design-tokens.md#date-picker-ds)). Confirm them with the designer.
- The `pl` and `en-GB` format choice is a product decision. Confirm it.
- The ref given to `ref` is read from the DOM by id once (`useElementByIdRef`). It is not refreshed if react-datepicker replaces the input.

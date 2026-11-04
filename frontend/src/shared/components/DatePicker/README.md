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

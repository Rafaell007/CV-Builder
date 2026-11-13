# useReturnFocus

Returns the focus to the element that opened a dialog, when the dialog closes. Radix returns focus only to its own `Trigger`; our dialogs open from page buttons and menu items.

Exports: `useReturnFocus()`. Spread the result on `Dialog.Content` or `AlertDialog.Content`.

Used by: `Modal` and `ConfirmModal` (so by every dialog in the app).

## Menu items

A menu item disappears when its menu closes. When the dialog opens from a menu item, the hook finds the menu button through the `aria-labelledby` of the `role="menu"` element and returns the focus to that button. This relies on Radix naming a menu by its trigger. Check it again after a Radix upgrade.

## Known issues

- **Only the Projects page opens dialogs from a menu today (KAN-102).** The menu behaviour is tested there and in the hook test. When another page opens a dialog from a menu, check the focus return with the keyboard once.
- **No opener means no focus change.** When nothing is focused or the menu button is missing, the hook does nothing and Radix decides. This is on purpose: focusing the page body would lose the place of the user.

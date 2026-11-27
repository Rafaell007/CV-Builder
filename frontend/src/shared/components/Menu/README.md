# Menu

Three-dot row actions, built on Radix `DropdownMenu`.

- **Props:** `items` (`label`, `onSelect`, optional `disabled`, `destructive`), optional `label` (name of the button, default `Actions`).
- Only one menu is open at a time. It closes on Escape, on a click outside and after an item is selected (Radix behaviour, covered by the tests).
- Opens near the button, aligned to its right edge, and renders in a portal so a table cannot clip it.
- Sizes (Figma, the open Users row menu): at least 90 wide, items 32 high with a 15px side inset, text 14/24, no inset above or below the items.
- Show only the items the user may use. The backend stays the real check.
- **Exports:** `Menu`, types `MenuItem`, `MenuProps`.

Used by: the action column of [DataTable](../DataTable/README.md) rows. Docs: [docs/pages/10-users-page.md](../../../../../docs/pages/10-users-page.md) (Admin Role).

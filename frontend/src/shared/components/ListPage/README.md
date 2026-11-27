# ListPage

The body of a list page (PLAN S5.1, S5.2, KAN-96): the sticky toolbar with the search field and the create button,
the list, and the page buttons. The route renders the `PageHeader` (top bar with the breadcrumbs) above it, as every
page does, because only the route knows its trail.

- **Props:** `search` (the `SearchField`), `createLabel` and `onCreate` (both or neither: without them there is no create button, e.g. for an employee on the Users page), `error` (the error state; when set, it replaces
  the list and the page buttons), `pagination` (the `Pagination`), `children` (the table). Modals are rendered by the
  caller next to it.
- The error replaces the list but not the toolbar, so the typed search stays (the field is uncontrolled).
- Toolbar: 56 high, sticky under the top bar (`top: 56px`), page background. A page with more sticky bars above it
  (the user tabs: header 56 + tabs 56) sets the CSS variable `--list-page-toolbar-top` to `112px` on a parent.
  Search 320 wide at left 20 (276 below 1024px).
- Create button: the `text` Button at 220×40, by default plus icon at left 12, text at left 52, 20 from the right edge
  (Projects, Departments, Positions). Below 1024px the button is the plus icon only (58×40, flush right, as drawn) and
  the text stays its accessible name.
- Figma draws some pages differently; such a page sets CSS variables on a parent (Figma first):
  `--list-page-toolbar-padding-right` (default `20px`, desktop only), `--list-page-create-justify` (default
  `flex-start`) and `--list-page-create-gap` (default `16px`). The CVs page centres the icon and text with an 8px gap,
  and on `/cvs` the button is 120 from the right edge (the User CVs tab keeps 20).
- Not in Figma: the page buttons are centred, 24 under the list.
- **Exports:** `ListPage`, type `ListPageProps`.

Used by: `features/projects`, `features/cvs`, the Departments and Positions pages (KAN-96). Values:
[docs/design-tokens.md](../../../../../docs/design-tokens.md) › Components › List page.

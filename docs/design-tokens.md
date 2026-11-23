# Design tokens (audit)

Values read from the CV Builder Figma file (view-only, 2026-10-28). The file has no named styles or variables, so these are raw layer values. Source of truth for `frontend/src/shared/styles/`. When Figma changes, update this file first.

Font: **Roboto** everywhere. LH = line height, LS = letter spacing (px). DS = page "Design system (components)", 1440 = page "1440px Desktop".

## Palette (every colour used)

| Hex | Used for |
|---|---|
| #F5F5F7 | light: page background · dark: main text |
| #E2E2E4 | light: menu / active nav bg · dark: secondary hover fill |
| #C4C4C6 | light: placeholder, input disabled fill |
| #AEAEAE | light: borders, dividers, disabled fill · dark: grey text, input border |
| #626262 | light: grey text, focus border · dark: borders, placeholder, disabled fill |
| #454545 | dark: menu / active nav bg |
| #2E2E2E | light: main text · dark: page background |
| #C63031 | primary red (both themes) |
| #E9B0B0 | primary active fill |
| #631818 | error notification border |
| #66BB6A / #335D35 | success fill / border + text |
| #FFB800 / #7F5C00 | warning fill / border |
| #29B6F6 / #145B7B | info fill / border |
| #5E5BE6 at 15% | light: date picker popup and arrow shadow |

## Colours (semantic)

| Role | Light | Dark | Source |
|---|---|---|---|
| Page background | #F5F5F7 | #2E2E2E | DS panels; 1440 screens |
| Surface (menu, active nav) | #E2E2E4 | #454545 | DS › Table › Nav; USER PROFILE › Aside › Link |
| Menu border | #AEAEAE | #626262 | DS › Table › Nav |
| Text main | #2E2E2E | #F5F5F7 | headings, cells |
| Text grey | #626262 | #AEAEAE | labels, inactive nav |
| Placeholder | #C4C4C6 | #626262 | DS › Input › Default |
| Input border | #AEAEAE | #AEAEAE | DS › Input › Default |
| Input border hover | #626262 | #F5F5F7 | DS › Input › Hover (dark: read 2026-11-03) |
| Input border focus | #626262 | #F5F5F7 | DS › Input › Active |
| Input border focus, password + textarea | #2E2E2E | #F5F5F7 | DS › Input & Textarea › Password / Textarea › Active |
| Input disabled text | #AEAEAE | #AEAEAE | DS › Input › Disabled |
| Input border invalid | #C63031 | #C63031 | DS › Input › Invalid |
| Input disabled fill | #C4C4C6 | #626262 | DS › Input › Disabled |
| Divider (table) | #AEAEAE 1px | #626262 1px | DS › Table › Data |
| Primary | fill #C63031, text #F5F5F7 | same | DS › Buttons › Primary |
| Primary hover | no fill, border + text #C63031 | same | DS › Buttons › Primary › Hover |
| Primary active | fill #E9B0B0, border + text #C63031 | same | DS › Buttons › Primary › Active |
| Disabled (button) | fill #AEAEAE, text #E2E2E4 | fill #626262, text #AEAEAE | DS › Buttons › Disabled |
| Tab active | text + 2px underline #C63031 | text #C63031 | SIGN IN tabs |
| Tab inactive | text #2E2E2E | text #F5F5F7 | SIGN IN, USER PROFILE tabs |
| Notification error | fill #C63031, border #631818 | same as light | DS › Notifications |
| Notification success | fill #66BB6A, border + text #335D35 | same as light | DS › Notifications |
| Notification warning | fill #FFB800, border #7F5C00 | same as light | DS › Notifications |
| Notification info | fill #29B6F6, border #145B7B | same as light | DS › Notifications |

## Typography

| Style | Weight · size · LH · LS | Source |
|---|---|---|
| Title | 400 · 34 · 42 · 0.25 | 1440 › SIGN IN › "Welcome back" |
| Heading | 400 · 24 · 32 · 0 | 1440 › USER PROFILE › user name |
| Body | 400 · 16 · 24 · 0.15 | 1440 › SIGN IN subtitle; sidebar nav item |
| Input value / placeholder | 400 · 16 · 23 · 0.15 | DS › Input |
| Textarea value | 400 · 14 · 24 · 0.15 | DS › Input & Textarea › Textarea › Active |
| Notification title | 500 · 16 · 16 · 0.15 | DS › Notifications |
| Table header | 500 · 14 · 24 · 0.15 | DS › Table |
| Table cell | 400 · 14 · 20 · 0.15 | DS › Table |
| Button | 500 · 14 · 24.5 · 0.4 · uppercase | DS › Buttons |
| Tab | 600 active / 500 inactive · 14 · 17.5 · 0.4 · uppercase | 1440 › SIGN IN, USER PROFILE tabs |
| Label | 400 · 12 · 23 · 0.15 | DS › Input › label |
| Notification text | 400 · 12 · 20 · 0.15 | DS › Notifications |
| Error text | 400 · 12 · 16 · 0.15 | DS › Input › Invalid |
| Calendar heading (`--text-calendar-heading`) | 500 · 18 · 24 · 0 | Date picker › month and year buttons, weekdays |
| Calendar day (`--text-calendar-day`) | 400 · 18 · 24 · 0 | Date picker › day numbers, today |

## Spacing

Figma uses no auto-layout, so there are no padding or gap fields; distances were measured from layer positions. Most values sit on a 4px grid, which becomes the scale. Off-grid values are not rounded: they stay exact in the component's CSS.

| Token | Value | Examples |
|---|---|---|
| `--space-1` | 4px | menu item top/bottom inset; input eye button top |
| `--space-2` | 8px | notification title top; title → description |
| `--space-3` | 12px | input text inset; notification close icon right |
| `--space-4` | 16px | button top/bottom; table cell left; nav icon inset |
| `--space-6` | 24px | page content left; notification stack gap |
| `--space-8` | 32px | menu item height |
| `--space-10` | 40px | search height |
| `--space-12` | 48px | button and input height |
| `--space-14` | 56px | header and nav link height |

Off-grid values (exact, per component):

| Element | Value | Source |
|---|---|---|
| Primary button side inset | 30px | DS › Buttons › Button |
| Menu item side inset | 15px | DS › Table › Nav › Link |
| Sidebar nav link gap | 14px | USER PROFILE › Aside › Nav |
| Table row height; cell text top | 73px; 27.5px | DS › Table › Row |
| Table header row height; text top | 57.8px; 16.8px | USERS › Table |
| Sign-in: heading → subtitle → email → password → button | 22 / 42 / 36 / 44px | SIGN IN › Form |
| Sign-in: heading from page top | 274px | SIGN IN › Form |
| USERS: content right edge | 26px | USERS › Main |
| Input eye button right | 6px | DS › Input › Button |

## Radius

| Element | Value |
|---|---|
| Button | 40px (pill) |
| Input, select dropdown | 0 |
| Row menu | 8px |
| Notification | 12px |
| Multi-select chip (`--radius-chip`) | 12px |
| Calendar month and year cells (`--radius-small`) | 4px |
| Avatar | 50% (circle) |
| Sidebar nav item | 0 200px 200px 0 (right side round) |

## Shadows

| Element | Value | Source |
|---|---|---|
| Primary button (light + dark) | 0 1px 5px 0 rgb(0 0 0 / 12%), 0 2px 2px 0 rgb(0 0 0 / 14%), 0 3px 1px -2px rgb(0 0 0 / 20%) | 1440 › SIGN IN, SIGN UP buttons |
| Secondary button, active (light only) | 0 4px 4px 0 rgb(0 0 0 / 25%) | DS › Buttons › Secondary › Active |

## Components

Read on 2026-11-03 (DS › Buttons, DS › Input & Textarea, 1440 › SIGN IN, 1440 › USERS; Select, Multi-select, Date picker and verification code from DS for KAN-78). "Both" = same in light and dark.

### Button (height 48, radius 40, text = Button style)

Side inset 30px, top/bottom 16px. Figma widths (160, ghost 220) are sample widths.

| Variant | State | Light | Dark |
|---|---|---|---|
| Primary | default | fill #C63031, text #F5F5F7 | same |
| Primary | hover | no fill, border 1px + text #C63031 | same |
| Primary | active | fill #E9B0B0, border 1px + text #C63031 | same |
| Primary | disabled | fill #AEAEAE, text #E2E2E4 | fill #626262, text #AEAEAE |
| Text (DS "Primary (V2)") | default | no fill, no border, text #C63031 | same |
| Text | hover / active / disabled | as Primary | as Primary |
| Secondary | default | no fill, border 1px + text #626262 | fill #454545, border 1px #E2E2E4, text #F5F5F7 |
| Secondary | hover | fill #AEAEAE, border 1px #626262, text #F5F5F7 | fill #E2E2E4, no border, text #454545 |
| Secondary | active | fill + border #626262, text #F5F5F7, shadow 0 4px 4px rgb(0 0 0 / 25%) | no fill, border 1px #E2E2E4, text #F5F5F7, no shadow |
| Secondary | disabled | as Primary | as Primary |
| Ghost | default | no fill, no border, text #626262 | text #F5F5F7 |
| Ghost | hover | border 1px #626262, text #626262 | border 1px #E2E2E4, text #F5F5F7 |
| Ghost | active | fill #AEAEAE, border 1px #626262, text #626262 | fill #E2E2E4, border 1px #454545, text #454545 |
| Ghost | disabled | as Primary | as Primary |

### IconButton (40×40, radius 20, icon 24×24 at 8px inset)

| State | Light | Dark |
|---|---|---|
| default | no fill, no border, icon #626262 | icon #F5F5F7 |
| hover | border 1px #626262, icon #626262 | border 1px #E2E2E4, icon #F5F5F7 |
| active | fill #AEAEAE, border 1px #626262, icon #F5F5F7 | fill #F5F5F7, border 1px #E2E2E4, icon #656565 |
| disabled | icon #AEAEAE | same |

### Text input, password, textarea

Input 48px high, text inset left 12px, top 14px; no radius, no fill. Textarea 120px high, 12px inset all sides. Borders are 1px.

| State | Light | Dark |
|---|---|---|
| default | border #AEAEAE, label shown as placeholder inside (#C4C4C6) | border #AEAEAE, placeholder #626262 |
| hover | border #626262 | border #F5F5F7 |
| active (focus or filled) | border #626262 (password, textarea #2E2E2E), value #2E2E2E, label above | border #F5F5F7, value #F5F5F7 |
| invalid | border + label + error text #C63031 | same |
| disabled | fill #C4C4C6, border #AEAEAE, value #AEAEAE | fill #626262 |

- Label (Label style): above the border with 0px gap (textarea: 1px), left 12px; colour #626262 / #AEAEAE; invalid #C63031.
- Error text (Error style): 1px below the border, left 12px.
- Password eye button: IconButton size, top 4px, right 6px. Icon: #626262 / #F5F5F7; disabled #AEAEAE; invalid #C63031. Shown: "visibility" glyph; hidden-state glyph 16×16 (not identified).

### Search field (1440 › USERS › Header)

40px high, radius 40, border 1px #AEAEAE. Icon 24×24 at left 12px; text left 43px (icon → text 7px). Placeholder as input. Icon #626262 / #C4C4C6. Only the default state is drawn.

### Select (DS)

Field as the text input: 48px high, border 1px, radius 0, no fill of its own (page colour shows through). Value / placeholder Input style at left 12, top 12. Label (Label style) above the border, left 12, shown when open, filled or disabled. Chevron: 24×24 at right 12 (left 364 of 400), top 12; Material chevron (7.41×12) pointing down, up when open.

| State | Border | Fill | Placeholder / value | Chevron | Label |
|---|---|---|---|---|---|
| default | #AEAEAE / #626262 | – / #2E2E2E | #C4C4C6 / #626262 | #626262 / #AEAEAE | inside |
| hover | #626262 / #F5F5F7 | – / #2E2E2E | as default | #626262 / #E2E2E4 | inside |
| open | #626262 / #F5F5F7 | – / #454545 | as default | #626262 / #E2E2E4 | #626262 / #F5F5F7 |
| filled | as open | as open | value #2E2E2E / #F5F5F7 | as open | as open |
| invalid | #C63031 both | – / #454545 | as default | #C63031 both | none drawn |
| disabled | #AEAEAE both | #C4C4C6 / #626262 | value #AEAEAE both (drawn 14/20) | #AEAEAE both | #626262 / #AEAEAE |

- Error text: drawn 10/16 (not the 12/16 Error style), #C63031, directly under the border, left 12.
- Open list: field width, attached under the field (no gap). Options 47px high, padding 12, Input text style; 1px border left and right, the last option also bottom. No background, radius, shadow or max height drawn.

| Option | Light | Dark |
|---|---|---|
| normal | text #2E2E2E, border #626262 | text + border #F5F5F7 |
| hover | fill #AEAEAE, text #2E2E2E | fill #626262, text #F5F5F7 |
| selected | fill #626262, text #F5F5F7 | fill #F5F5F7, text #2E2E2E |

Single select has no check mark.

### Multi-select (DS)

Field and list as Select. Selected options show as chips inside the field.

- Chip: 24px high (168 is a sample width), radius 12, border 1px #2E2E2E / #AEAEAE, no fill; text Input style, left 12, #2E2E2E / #F5F5F7. Disabled: border + text #AEAEAE.
- Remove: 12×12 circle #AEAEAE, 6px from the chip's right edge, top 6; inside a 6×6 X #F5F5F7 / #454545.
- Chips 13px apart, in a row at left 12, top 12 of the field. Growth with many chips not drawn.
- Option rows: checkbox 20×20 at left 12, border 1px; check 13.33×9.17, 2px stroke. On selected rows (fill #626262 / #F5F5F7) border + check are #F5F5F7 / #2E2E2E.

### Date picker (DS)

- Field as Select; border #AEAEAE both; placeholder #C4C4C6 / #626262. Calendar icon 24×24 at right 12, top 12 (18×18 glyph, 2px stroke), #626262 / #AEAEAE.
- Popup: 449×340 (wider than the 400 field), attached under the field, radius 0 0 8px 8px, border 1px #AEAEAE, no fill. Shadow light only: 1px 1px 4px 1px rgb(94 91 230 / 15%); dark none.
- Header: 48px row at top 24, sides 32, space-between. Month and year: 500 · 18 · 24, #2E2E2E / #F5F5F7, in buttons 48px high, radius 4, padding 8/12, gap 8. Arrows: 40×40 circles, 9px apart, border 1px; light fill #F5F5F7, border + chevron #626262, popup shadow; dark fill #2E2E2E, border + chevron #F5F5F7. Chevron 7.41×12.
- Weekday row: 500 · 18 · 24, #2E2E2E / #F5F5F7.
- Drawing of all views, light and dark (added 2026-11-05): [images/date-picker-layout.png](images/date-picker-layout.png). It shows the day view, the month list and the year list. See "Date picker layout drawing" below for what it settles.
- Days: 400 · 18 · 24, no cell frames. Current month #2E2E2E / #F5F5F7; outside the month #AEAEAE / #626262; disabled strikethrough #626262 / #AEAEAE. Highlighted day: 41×41 circle #C63031, text 500 #F5F5F7 (only one state drawn).

### Verification code (DS › EMAIL VERIFICATION)

6 boxes, 48×48, 16px apart (the last gap 17 is read as a layer artefact), border 1px #AEAEAE both, radius 0. Inner input 23×23, dark fill #2E2E2E. Only the empty state is drawn.

### List page (1440 and 768 › Departments, Positions, Projects, CVs, User Details – CVs; light / dark)

Read on 2026-11-18 for KAN-96 (Properties panel; Dev Mode is locked). Shared `ListPage` under the route's `PageHeader`. On the User Details tabs the tabs bar (56, sticky) sits between the header and the toolbar, so the toolbar sticks at 112.

- Top bar: the App shell header (56, sticky, page background), the page name as the breadcrumb (Body style, #626262 / #AEAEAE) at 16 / 20.
- Toolbar: 56 high, directly under the top bar, sticky, page background. Search field 320×40 at top 8, left 20 (768: 276 wide).
- Create button: the Text Button (no fill, no border, text #C63031, uppercase Button style) at 220×40, radius 40, 20 from the right edge, top 8. Plus icon 24 box (14×14 glyph, #C63031) at left 12, text at left 52 (icon → text 16). CVs and User CVs: icon and text centred (icon 56, text 88, icon → text 8); CVs page 120 from the right edge (re-read 2026-11-19). 768: plus icon only, 58×40, flush right (left 606 in the 664 column).
- Table: directly under the toolbar; header 58, rows 73, cell text at left 16; the actions column (74 wide, 17 on each side) holds a 40×40 kebab; the row and header lines run under the actions column too. 10 rows on a page (D19). 768: rows 72, the actions column 56 wide (8 on each side, kebab icon at left 16); the CVs list hides the Employee column (re-read 2026-11-19).
- Sort arrow: 12×12 arrow glyph in an 18×18 box, #626262 / #AEAEAE, drawn pointing up next to every sortable header, none marked as sorted.
- Not drawn: the page buttons, the open row menu, the empty / loading / error states, hover / pressed / disabled of the create button.
- Name-only modals (Departments, Positions): the Form modal and Confirm modal below at 620×200 (one field: title → field 26, field → buttons 26, bottom 16). Titles "Create / Update / Delete department|position", buttons CREATE, UPDATE, CONFIRM and CANCEL; the delete message names the item in 700.

### Modal (sections ADD SKILL, UPDATE SKILL, REMOVE SKILLS, CONFIRM TO REMOVE SKILLS)

Read on 2026-11-04 for KAN-81. Positions from the modal's top-left.

- Overlay: #121212 at 60% over the whole screen, both themes.
- Panel: 620 wide, fill #F5F5F7 / #454545, no radius, border or shadow. Padding (measured from children, no auto-layout): 16 top and bottom, 24 left and right.
- Title: 500 · 20 · 24 · 0.15, text main (#2E2E2E / #F5F5F7), at 16 / 24.
- Close: 24×24 button at top 14, 24 from the right; 12×12 cross at 7,7, #2E2E2E in light.
- Form modal (620×284): title → first field 26; fields 572×48, 36 apart; last field → buttons 26.
- Confirm modal (620×200): message 572 wide in the Body style (400 · 16 · 24 · 0.15), text main; title → message 40, message → buttons 44, bottom 16. The count ("3 skills") is 700 in dark; light read as 500.
- Button row: right-aligned, 24 apart, 160×48 each. CANCEL secondary (light border + text #2E2E2E, dark #E2E2E4); ADD / UPDATE / CONFIRM primary.

### Selection toolbar (1440 › REMOVE SKILLS)

- Bar at the bottom of the main content, sticky, 852×64 in the sample, no fill (background blur 0.5).
- Buttons right-aligned, 160×48, 24 apart: CANCEL secondary (border + text #626262 / #E2E2E4), DELETE primary.
- Count badge inside DELETE: 16×16, radius 20, fill #F5F5F7, number 500 · 12, #C63031.
- Selected item (page side, not the toolbar): no fill or border; its level bar turns #AEAEAE / #454545 at 90%.

### Toast (DS › Notifications, light only)

280×80, radius 12, border 1px, no shadow; colours in "Colours (semantic)" → Notification. Text: success #335D35, error #F5F5F7 (warning and info not read). Title in the Notification title style at 8 / 16; text in the Notification text style at top 40; close 24×24 at top 8, 12 from the right, 12×12 cross in the text colour. Title LH is 16 in success, 24 in error. Screen position not drawn.

### App shell (1440 › USERS, USERS (admin), USER PROFILE, SETTINGS; 768px Tablet › USERS (admin), SETTINGS)

Sidebar, expanded (1440):

- 200 wide, no fill and no border: the page background shows through.
- Logo row 200×56: logo 24×24 at top 16, left 16; "CV Builder" 500 · 16 · 24 · 0.15, text main.
- Nav item 200×56, radius `0 200px 200px 0`; icon 24×24 at top 16, left 16; text at left 56 in the Body style. Items 14 apart; the first is 14 under the logo row.
- Default text + icon: text grey (#626262 / #AEAEAE). Active: text main (#2E2E2E / #F5F5F7) on `--color-surface` (#E2E2E4 / #454545).
- Admin group divider: 1px, #AEAEAE / #626262, 14 under the last user item and 14 above the first admin item.
- Collapse button: 24×24, radius 20, top 51, its centre on the sidebar's right edge (left 188 of 200, so 12 px over the content). Fill: page background (#F5F5F7 / #2E2E2E, read on Tablet). Chevron 7.41×12 at 8,6, #626262 / #AEAEAE.

Sidebar, collapsed (768px Tablet):

- 56 wide, icons only; logo row 56×56 with the logo only (24×24 at 16,16).
- Nav item 56×56, radius `0 200px 200px 0`, icon centred at 16,16; active fill and colours, 14px gap and divider (56×1) as expanded.
- Collapse button at left 44 (centre on the 56 edge), top 51.

Profile row and menu:

- Row 56 high, 56 from the bottom. Avatar 40 circle at left 8, top 8, fill #C63031; initial 500 · 20 · 20 · 0.4, uppercase. Name at left 56, top 16, Body style, text main. Collapsed: avatar only.
- Menu: as wide as the sidebar (200 or 56) × 121, 5 px above the profile row, radius 8, 1px border #AEAEAE / #626262, fill `--color-surface`, no shadow.
- Menu items 40 high, radius `0 200px 200px 0`; icon 24 (16 glyph) at left 16, top 8; text at left 56, Body style, text main. A 1px line #AEAEAE / #626262 under Settings (above Logout).

Header and content:

- Header 56 high, sticky at top 0, page background fill; from 24 after the sidebar to 26 before the right edge (1440: 1190 wide).
- Breadcrumbs at top 16, left 20 inside the header, Body style, title case. Link and current page: text grey (#626262 / #AEAEAE). Separator: chevron-right in a 20×20 box (glyph 6.17×10), #AEAEAE in both themes, 8 px on each side.
- Highlighted item (the user in `Employees › User › Profile`): #C63031 in both themes, person icon 24 (16 glyph), 8 px before the text.
- Content: 24 after the sidebar, directly under the header (no gap); right edge 26 (see Spacing).

### Device error (768px Tablet › DEVICE ERROR, 768w light / dark)

- Full screen, page background; nothing else on the screen (no sidebar, header or button).
- Content box 560×591, centred both ways; the content sits at its top, so it ends up about 40px above the screen's middle.
- Illustration 160×120 at box top 127, centred: a monitor with a sad face, 2px centred strokes in text main (#2E2E2E / #F5F5F7). Parts (box coordinates): screen 160×100 at 127/200 (outline only); eyes 6×6 filled circles at 159/252 and 159/302; frown 60×10 at 182/250; stand 60×20 at 227/250; base line 80 at 247/240.
- "Oops": Title style, text main, centred, 24 under the illustration.
- Message: Body style, text main, centred, 24 under "Oops", two lines (break after "devices."). No emphasised phrase.

### No internet (1440 › NO INTERNET ERROR, 768px Tablet › INTERNET ERROR; light / dark)

- Same layout as Device error: full screen, page background, content box 560×591 centred both ways (1440: top 155, left 440; 768: top 217, left 104); no sidebar or header. Light and dark differ only in colours; 768 and 1440 differ only in the frame size.
- Illustration: identical to Device error (160×120 at box top 127, centred; 2px strokes in text main).
- "Oops": Title style (400 · 34 · 41.99 · 0.25), text main, centred, top 271 (24 under the illustration).
- Message: "Something went wrong. We're already working on fixing it. Please try again or go back." Body style, text main, centred, 560 wide, top 335 (24 under "Oops"), two lines with the break after "fixing it.". No emphasised phrase.
- RETRY: primary button, 220 wide (not the 160 minimum), with the primary button shadow; top 407 (24 under the message), centred. Text "Retry" in the Button style, uppercase.

### Not found (1440 › Not found, 768px Tablet › PAGE ERROR, 768w light / dark)

- Identical to No internet (content box, illustration, title and message styles and positions, primary button 220×48 at top 407 with the primary button shadow); only the texts differ.
- Title: "Hmm...".
- Message: "This doesn't seem to be the page you were looking for. Let's get you back on track." Two lines, break after "looking for." (see Decisions).
- Button: "Go back" in the Button style, uppercase.

### Settings (1440 › SETTINGS, 768px Tablet › SETTINGS; light / dark)

- Form column: 852 wide, centred in the content area (1440: left 193 in the 1240 content; 768: fills the content, 664 wide with the usual 24 padding). Top 72 in the content area. Same column as the CV Details form.
- Order and positions (column-relative top / height): Theme select 0 / 48, Language select 84 / 48, "Change password" 168 / 24, Password 216 / 48, New Password 300 / 48, Confirm Password 384 / 48, CHANGE 468 / 48.
- Gaps: fields 36 apart; Language → heading 36; heading → Password 24; Confirm Password → CHANGE 36.
- "Change password": Body style (400 · 16 · 24 · 0.15), text main (#2E2E2E / #F5F5F7).
- CHANGE: primary button 160×48, radius 40, right-aligned in the column (disabled fill #AEAEAE, as the Button disabled state).

### Tabs and CV Preview (1440 › User profile, CV tabs, CV Preview = `docs/images/figma/desktop-1440/light/frame-41.png`; measured on the images, 2026-11-23)

- Tabs: every tab 150 wide, the tabs touch each other, the first starts at x 224 (the content edge), the label is centred (500 / 600 active · 14 · uppercase). The active underline is 2px, #C63031, the full 150 wide, at y 110–111. The header is 56 and the tab bar ends at y 112 (the tab is 52 high under a 4px page padding). No line under the tab bar.
- Document column: 852 wide, centred in the content. The document and the EXPORT PDF button start 34 under the tab bar (y 146). The button is 160 × 40, text style Button, transparent with a red border and red text, at the right edge of the column, on the row of the name.
- Name (Title, 34 / 42) and position (Body, uppercase, 24) follow each other with no gap. Header → overview 32. The sections (overview, Projects, Professional skills) are 32 apart; a section title (Title, 42) → its content 32.
- Overview and project blocks: left column 260, a 1px #C63031 line, the right column starts 24 after the line. The text starts 16 under the top of the line. Heading → value 8, block → block 16.
- Skills table (852 wide): columns 240 (category) · rest (skill) · 115 (experience) · 140 (last used); cell side padding 16. Header text 14 / 21 (a wrapped header has a 21px line pitch), 8 above and 8 below, then a 1px #C63031 line. A row is 37 (8 + 20 + 9); the last row of a category is 53 and a 1px #AEAEAE line (54 together).
- Not copied: the Figma lines between the columns end at the top of the last text line (about 17px above the end of the text). Our lines cover the whole text and the 16px padding, so a long text is never next to a missing line.

### CV Skills (1440 › CV Skills = `docs/images/figma/desktop-1440/light/frame-45.png`, dark = the same frame in `dark`; measured on the images, 2026-11-23)

- Block: 852 wide, centred; the first category name starts 34 under the tab bar (y 145). Category name: Body, #2E2E2E / #F5F5F7. Category name → skills 16; category → category 32.
- Skills: three columns of 284, rows 48, no gaps between them. The skill is padded 16 left; the bar starts there, the name starts 16 after the bar (name in the secondary text colour).
- Level bar: 80 × **4** (not 3). The fill is 20, 40, 60, 80, 100% of the width: grey, blue, green, yellow, red. Light fill: #717171, #1A93D5, #428946, #FEBE19, #CB4445; track: #B5B5B5, #A7D5EE, #B6D1B8, #FEE6A7. Dark fill: palette grey-500, blue, green, yellow, red; track: grey-600, blue-dark, green-dark, yellow-dark (all drawn at 90% over the page; tokens `--color-mastery-*`). The red bar is always full, so it has no track.
- ADD SKILL (grey) and REMOVE SKILLS (red): each 220 × 40, icon and text centred with 16 between them, 16 between the buttons, the right button ends 24 before the right edge of the block, the buttons start 52 under the last skill row.
- Not checked: the selected skill in the selection mode (this frame shows none; the older note under "Selection toolbar" says the bar turns grey at 90%) and the tablet layout.

### CV Projects (1440 › CV Projects = `docs/images/figma/desktop-1440/light/frame-46.png`, dark = the same frame in `dark`; measured on the images, 2026-11-23)

- Columns: Name, Domain, Start Date, End Date and the kebab. **No Responsibilities column** (the page doc lists one; see `frontend/src/features/cvs/README.md`).
- Under a row: the project description (14 / 20, two lines in the sample), then 18 below it the responsibilities as tags. A tag: filled pill 24 high, 8 at the sides, 13 / 20 text (`--text-tag`), 8 between tags. Light fill #E2E2E4 with #2E2E2E text, dark fill #626262 with #F5F5F7 text (`--color-tag-bg`). Each line of the responsibilities text is one tag. The environment technologies of the project are not in the list: they are in the Add project modal (frame-47).
- Search 320 wide at x 244; ADD PROJECT: text button 220 × 40, plus icon and text centred, 8 apart.
- Table (shared `DataTable`, all list pages): header 58, rows 73 apart; a row with a detail line is 71 high and has 16 under the detail. The CV projects list has no line under the last row (Languages and Projects lists have one).
- Not matched on purpose: the description colour. Figma draws #919192 in both themes (about 3:1 on the light page); we keep `--color-text-secondary` for the contrast (decided 2026-11-23).

### Icons

No icon names in the file, but every glyph matches Google Material Icons by size and position: more-vert (4×16 at 10,4), visibility (22×15 at 1,4.5), search (17.49 at 3,3), chevron-right (7.41×12 at 8.59,6). We use Material Icons paths (Apache 2.0).

## Decisions where Figma is unclear

There is no designer to ask; we follow Figma as closely as possible and decide the gaps ourselves.

- Dark 1440 frames have a second fill #121212 under #2E2E2E; read as a covered underlay and ignored (fill opacity is not visible in view mode).
- DS primary button has no shadow, but the screens do; we follow the screens.
- No dark notifications; we use the light colours.
- The input state "Active" means focus.
- Off-grid spacing (30, 15, 14, 22, 42, 36, 44, 26, 73px) is kept exact, not rounded.
- Skill type and category names are backend data and are shown as stored, untranslated, in every language (the type is a free string, so a fixed list of translations would miss new types).

Predictions for KAN-77 (2026-11-03): not drawn in Figma, chosen by us; fix here and in the token when a better source appears.

- Focus border: text input #626262, password and textarea #2E2E2E in light, as drawn (each component follows Figma).
- Keyboard focus on buttons and icon buttons: 2px outline #626262 / #F5F5F7, offset 2px, only on `:focus-visible`.
- Button loading: disabled colours, label kept, 16px spinner (2px stroke) in the text colour, 8px before the label.
- Primary button shadow only in the default state (the screens draw only that state; DS hover/active have none).
- Password hidden-state icon: Material "visibility-off" (the 16×16 Figma glyph is not identified).
- Disabled input value: 16px like every other value (Figma shows 14px in one sample).
- Button width: `min-width: 160px` with 30px side inset. The SIGN IN button (50px inset at 160px) comes out the same; ghost keeps 30px, not 28px.
- Textarea: invalid state like the input; resizes vertically only.
- Search field hover and focus: input borders; height 40px (the 45px border box is a layer artefact); the light inner shadow (spread 30px #F5F5F7) is ignored.
- Helper text: Error text style in #626262 / #AEAEAE.
- Invalid label is red inside the empty field too (Figma draws invalid only with a value).
- The label moves without animation (none drawn).

Accessibility over Figma (2026-11-03): Figma's placeholder colour fails WCAG AA contrast (4.5:1): #C4C4C6 on #F5F5F7 is 1.59:1, #626262 on #2E2E2E about 2.3:1. The field label resting inside an empty field and the search placeholder use the grey text colour instead (#626262 / #AEAEAE, the floated label's colour). `--color-text-placeholder` stays in the tokens with its Figma value.

Calendar days outside the month (2026-11-04): Figma #AEAEAE / #626262 is about 2:1 and these days can be picked. They use the grey text colour (#626262 / #AEAEAE, 4.5:1 or more); only the strikethrough sets disabled days apart.

Error text in dark (2026-11-03): #C63031 on #2E2E2E is 2.5:1. In dark, error text and the invalid label use #E9B0B0 (palette red-light, about 7:1) via `--color-error-text`; the invalid border and the password eye keep #C63031. Light is unchanged.
- Dark IconButton active icon #656565 is read as #626262 (not in the palette). Dark search icon #C4C4C6 is kept as drawn.
- Secondary dark hover has no border in Figma; the border takes the fill colour, so the button keeps its size.
- 1440 › SIGN IN "Forgot password" (dark text #C4C4C6) differs from DS Ghost (#F5F5F7); we follow DS.

Predictions for KAN-78 (2026-11-03): not drawn, or drawn inconsistently, in DS; chosen by us. Fix here and in the CSS when a better source appears.

- Select, multi-select and date picker share the text input's frame, so the KAN-77 decisions apply: label rests inside as the placeholder in the grey text colour (contrast), invalid label red, disabled value 16px (not the drawn 14/20), no label animation.
- Select error text: the input's Error style (12/16), not the drawn 10/16, so every field's error looks the same.
- Open list: page background fill (the frame colour shows through), max height 5 options (235px) then scrolls, no shadow or radius; keyboard highlight uses the hover colours.
- Dark Select fill #454545 when open or invalid, as drawn; hover keeps #2E2E2E.
- Multi-select chips wrap onto new lines and the field grows; the row's inset shadow (spread 30px #F5F5F7) is ignored, as in the search field. Unselected checkbox: border in the option text colour (#2E2E2E / #F5F5F7), no check.
- Multi-select details not drawn: wrapped chip rows 12px apart; checkbox → option text 12px; the × has a 22×22 hit area (circle centred, still 6px from the chip's edge), a 1.5px X stroke and the focus ring when focused; disabled chips have no ×. Chip text line height 22px so the text fits inside the 24px chip with its borders.
- Date picker dark border on all four sides (drawn without the bottom: read as an artefact).
- Calendar: the highlighted circle is the selected day; today is a 1px #C63031 ring with the normal text colour; hover is a circle in --color-surface (#E2E2E4 / #454545), changed from the option hover fill on 2026-11-05 as too dark; the month list, year list and header buttons hover the same. Day cells 41×41. Month and year buttons switch to a month or year list.
- Calendar icon: Material "calendar_today" outlined (the 18×18 glyph is not identified).
- Calendar layout below the header (not drawn): 8px under the header row, weekday row 24px, day rows 41px with no gap; the popup grows with a 6-week month. Month and year lists: 3 per row, 8px apart, radius 4, hover and selected as the days. Header buttons: option hover fill on hover and while their list is open. Arrows: see "Date picker layout drawing and formats" below. Invalid: the calendar icon turns red, as the select chevron.
- English month and day names are British English: US English names days "November 4th", which fails axe (the visible "4" is not a word of the name). The date FORMAT is not British: see the decision of 2026-11-05 below.

Date picker layout drawing and formats (2026-11-05, decided by Maciek, PLAN D34): [images/date-picker-layout.png](images/date-picker-layout.png) is a design source. It replaces the "Prediction" above for the month and year lists, where they differ. The code follows it:

- The month list and the year list are drawn (3 per row; 12 months; 12 years, 2022–2033 for 2025). The 12-year paging is therefore in the design.
- All three views keep the two round arrows in the header (decided 2026-11-05). Day view: they page months. Month list and year list: they move the saved date by one month or one year, so the red selection travels and the value is saved at every click; the list pages itself when the date leaves it (December → January, last year of a page → next page). The drawing does not show this: our choice.
- Month names in the month list are full ("January").
- The open list is marked in the header: the month (month list) or the year (year list) is red text, no fill. In dark the red is `--color-error-text` (#E9B0B0), because #C63031 on #2E2E2E has 2.5:1 contrast.
- The selected month or year is a red rectangle, 106 × 34, radius 4, light text, as the selected day is a red circle. Rows are 50px apart. These sizes are measured from the drawing (shown at 0.757 of real size).
- The week starts on Sunday in both languages (the drawing shows S M T W T F S).
- Date format: `en` MM/dd/yyyy (page 23 image: 08/21/2023), `pl` dd.MM.yyyy. The CV preview (page 24) has its own `MM.YYYY` rule.
- Not changed: the drawing's weekday row shows one letter ("S"); the code shows three ("Sun").
- Picking steps: day → month list → year list; each click saves the date, the year click closes the calendar. The header month and year buttons are shortcuts into the month and year step.
- No clear button on date fields; an empty End Date shows as "Till now" in the list. A typed text that is not a date is the same error as an empty date.
- Code boxes: the whole 48×48 box is the input (the 23×23 inner input is a layer); digit in the Input value style, centred; hover, focus, invalid and disabled as the text input; boxes 16px apart.

Predictions for KAN-81 (2026-11-04): not drawn, or drawn inconsistently; chosen by us. Fix here and in the CSS when a better source appears.

- Modal is centred on screen (Figma tops differ by 5px between themes: read as an artefact); width `min(620px, 100% - 32px)`; the content scrolls inside when the screen is too short.
- Modal CANCEL uses the DS secondary button (#626262 light), as the selection toolbar does; the modal's #2E2E2E light border is read as an inconsistency.
- Dark close cross #F5F5F7 (text main); not read.
- Confirm modal: the highlighted part of the message (count) is 700 in both themes; the caller passes it.
- Selection toolbar: the button text comes from the page (Figma says DELETE, the page doc says REMOVE); the count shows in the badge, the badge is hidden at 0 and the button disabled. The bar gets the page background fill (no fill lets scrolled content show through the sticky bar); the 0.5px blur is ignored. Predictions: bar padding 8px top and bottom (64 − 48), none at the sides; badge number LH 16 (the badge height), letter spacing 0; badge 8px after the label (the Button gap).
- Toast: bottom-right, 24px from the edges, newest at the bottom, 8px apart, max 3. Width 280, height grows with the text (80 is the sample). Title LH 24 (as error; the description at top 40 then sits 8 under it). Dark uses the light colours (as before). Warning and info text are #2E2E2E.
- Close cross in a toast: same 24×24 button and focus ring as the modal's.
- Close button (`CloseButton`): cross in the colour of the text around it; hover a 1px border in that colour; keyboard focus the Button ring. The 12×12 cross is centred (Figma 7,7 in the 24 box is 1px off-centre: read as an artefact).

Toast text contrast (2026-11-04): success #335D35 on #66BB6A is 3.2:1 and fails WCAG AA for 12/16px text (the same pattern gives warning 3.5:1 and info 3.2:1). Success, warning and info text use #2E2E2E (5.7–7.8:1); the borders keep their Figma colours. Error text #F5F5F7 on #C63031 is 5.0:1 and stays.

Predictions for KAN-82 (2026-11-06): not drawn, or drawn inconsistently; chosen by us. Fix here and in the CSS when a better source appears.

- Sidebar state: 1440 draws it expanded, 768 collapsed. Until the user clicks the collapse button, the width decides: collapsed below 1024px, expanded from 1024px (1024 is our choice; Figma has only 768 and 1440). A click overrides it until the page reloads; it is not saved.
- Collapse chevron: Figma draws `<` in both states; ours points right (`>`) when collapsed, so it shows what a click does. `aria-expanded` gives the state.
- Header offset: Tablet draws the header 37px after the sidebar but the content at 24; read as an artefact. Header and content both start 24 after the sidebar, as on 1440.
- Collapse button fill: page background in both sizes (read on Tablet only), so it covers the sidebar edge.
- Collapsed nav items and avatar keep their text as the accessible name (visually hidden or `aria-label`).
- Device error: the 591-high box is copied and centred, so the content lands where Figma has it; no separate offset. The message is two sentences on two lines (the line break comes from the text, not from width). Monitor screen corner radius is not shown in Figma: 8px, estimated from `docs/images/09-device-error-page.jpg`. The "Oops" layer name ("С возвращением") is a leftover and ignored. The monitor stand legs (60,100→50,120 and 100,100→110,120 in the 160×120 illustration) are estimated from the same screenshot. Known limitation: the gate is a width media query, so 400 % zoom on a 1280px screen (320 CSS px) shows it too (WCAG 1.4.10 Reflow); accepted because the app does not support widths under 768px.
- Icons (Material, identified from the screenshots; Figma has no names): Employees "people", Skills "trending_up", Languages "translate", CVs "contact_page" outlined, Departments "domain" outlined, Positions "work_outline", Projects "folder_copy" outlined; profile menu "person_outline", "settings" outlined, "logout"; breadcrumb user "person_outline". The logo is not a Material icon: it is `LogoIcon`, exported from Figma as SVG (the light and dark theme files have the same shapes and fill colours, so one component serves both themes).
- Hover states (not drawn): nav link and collapse button text turn text main (#2E2E2E light / #F5F5F7 dark); the profile row gets the surface fill on hover and while its menu is open; a highlighted menu item gets the page background.
- Collapse button: accessible name "Sidebar" (both states) plus `aria-expanded`, so a screen reader hears "Sidebar, expanded / collapsed".
- Page title: Figma shows none (the breadcrumbs name the page). Each page still has an `<h1>` for screen readers, visually hidden, in `PageHeader`.
- Profile avatar: its own one-letter red circle in the sidebar, not the shared `Avatar` component (no photo in the sidebar).
- No internet text: we use the Figma message ("…Please try again or go back."), not the shorter one in `docs/pages/07-no-internet-page.md` ("…Please try again."), because Figma is the source of truth. The user goes back with the browser's Back button; the screen has no back button.
- Not found message: Figma has no typed line break; the text wraps on its own after "looking for." in the 560 box. We put the break in the text (like Device error and No internet), so the lines stay the same in every language and font rendering. GO BACK with no previous page in the tab (link opened directly) goes to `/`, which redirects to `/users`.

Highlighted breadcrumb (2026-11-23): both themes use `--color-primary` (#C63031), as Figma draws it. Before, dark used the light pink #E9B0B0 for contrast (#C63031 on #2E2E2E is 2.5:1). The team chose the design red over the contrast.

Avatar initial in dark (2026-11-06): Figma draws #2E2E2E on #C63031, 2.5:1. The initial uses #F5F5F7 in both themes (5.0:1).

List pages (2026-11-18, KAN-96): drawn inconsistently; chosen by us.

- Read as artefacts: the dark Departments list shows position names; the Create department title has line height 20 (the other modal titles 24; we use 24); the dark Update department field is 852 wide and runs past the modal (we use 572); the 768 Departments title is singular "Department" (we use "Departments", as the nav); the "?" after the bold name is 500 in dark (we use 400, as light).
- Offsets of 1–4px between light and dark are ignored (main height 888 / 900, header Name cell 1190 / 1116, create text at 48 in light Departments but 52 everywhere else, tablet columns 606 / 58 and 608 / 56, kebab at 9 / 8). The 768 title sits at 13, 25 or 0 and the light 768 Projects search at 0: both use 20, as on 1440.
- Page buttons (not drawn): centred, 24 under the list.
- Sort arrow (Material "arrow_upward", `--color-sort-icon`): Figma draws no sorted state, so it is always fully visible, with no hover change. It points down for DESC and up otherwise; `aria-sort` on the header cell tells screen readers. Text → arrow 4 (`--space-1`), not measured.
- Create button content (changed 2026-11-19, "Figma first"): Departments, Positions and Projects draw the icon and text at the left (icon 12, text 52; 48 in light Departments is an artefact); the CVs page and the User CVs tab centre them (icon 56, text 88, gap 8). Each page follows its own frame. The right edge: 20 everywhere, but 120 on the CVs page (1440, both themes); built as drawn. `ListPage` CSS variables carry the differences.
- Skills modals (2026-11-20, KAN-98): Figma's texts win over `docs/pages/17-skills-page-admin.md`: the edit modal is "Update skill" with an "Update" button (the doc says "Edit skill" and SAVE), and the name field is labelled "Name" (the doc says "Skill"). No Type field is drawn, so the modal has Name and Category only. Departments and Positions keep their built texts ("Edit …", "Save").
- 768: the CVs toolbar has no fill; a sticky bar needs one, so it keeps the page background. Dark 768 widths 2px off (666 / 664, search 278 / 276), the User CVs tab bars at left 22 and 37, and its dark top bar without fill: read as artefacts, laid out as on the other pages.

Settings (2026-11-16): the "Change password" text is at left 2 in 1440 light but 0 in dark and on 768; read as an artefact, it starts at 0. On 768 the CHANGE button keeps the desktop left 692, outside the 664 column; read as an artefact, it stays right-aligned in the column as on 1440.

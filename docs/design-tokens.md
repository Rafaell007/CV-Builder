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
- Days: 400 · 18 · 24, no cell frames. Current month #2E2E2E / #F5F5F7; outside the month #AEAEAE / #626262; disabled strikethrough #626262 / #AEAEAE. Highlighted day: 41×41 circle #C63031, text 500 #F5F5F7 (only one state drawn).

### Verification code (DS › EMAIL VERIFICATION)

6 boxes, 48×48, 16px apart (the last gap 17 is read as a layer artefact), border 1px #AEAEAE both, radius 0. Inner input 23×23, dark fill #2E2E2E. Only the empty state is drawn.

### Icons

No icon names in the file, but every glyph matches Google Material Icons by size and position: more-vert (4×16 at 10,4), visibility (22×15 at 1,4.5), search (17.49 at 3,3), chevron-right (7.41×12 at 8.59,6). We use Material Icons paths (Apache 2.0).

## Decisions where Figma is unclear

There is no designer to ask; we follow Figma as closely as possible and decide the gaps ourselves.

- Dark 1440 frames have a second fill #121212 under #2E2E2E; read as a covered underlay and ignored (fill opacity is not visible in view mode).
- DS primary button has no shadow, but the screens do; we follow the screens.
- No dark notifications; we use the light colours.
- The input state "Active" means focus.
- Off-grid spacing (30, 15, 14, 22, 42, 36, 44, 26, 73px) is kept exact, not rounded.

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
- Calendar: the highlighted circle is the selected day; today is a 1px #C63031 ring with the normal text colour; hover is a circle in the option hover fill (#AEAEAE / #626262). Day cells 41×41. Month and year buttons switch to a month or year list.
- Calendar icon: Material "calendar_today" outlined (the 18×18 glyph is not identified).
- Code boxes: the whole 48×48 box is the input (the 23×23 inner input is a layer); digit in the Input value style, centred; hover, focus, invalid and disabled as the text input; boxes 16px apart.

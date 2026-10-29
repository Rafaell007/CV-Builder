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
| Input border hover | #626262 | not found | DS › Input › Hover |
| Input border focus | #626262 | #F5F5F7 | DS › Input › Active |
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

Component-level details (secondary, ghost and select states) are left for the component tickets.

## Decisions where Figma is unclear

There is no designer to ask; we follow Figma as closely as possible and decide the gaps ourselves.

- Dark 1440 frames have a second fill #121212 under #2E2E2E; read as a covered underlay and ignored (fill opacity is not visible in view mode).
- DS primary button has no shadow, but the screens do; we follow the screens.
- No dark notifications; we use the light colours.
- The input state "Active" means focus.
- Dark input hover border: not found; we keep the default border (#AEAEAE) on hover.
- Off-grid spacing (30, 15, 14, 22, 42, 36, 44, 26, 73px) is kept exact, not rounded.

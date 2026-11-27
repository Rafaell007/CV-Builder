# Figma layout exports

PNG exports of the CV Builder screens from Figma. They add to the single page images in `docs/images/` (one image per page): they show more screens, the modals and the tablet layout, in light and dark theme.

## Folders

| Folder | Size | Frames |
| --- | --- | --- |
| `desktop-1440/light`, `desktop-1440/dark` | 1440 x 900 | 62 each |
| `tablet-768/light`, `tablet-768/dark` | 768 x 1024 | light 63, dark 61 (see "Known issues") |

- File name: `frame-NN.png`. NN is the order of the Figma export, not the number of a page in `docs/pages/`.
- The same NN in `light` and `dark` is the same screen. This was checked for `desktop-1440` frame 58.

## Frames checked by hand

Only these frames were opened and checked. For all other frames, open the image to see what it shows.

| Screen | `desktop-1440` | `tablet-768` |
| --- | --- | --- |
| Projects list (admin) | 58 | 53 |
| Create project modal | 59 | 54 |
| Update project modal | 60 | not checked |
| Delete project modal | 61 | not checked |
| CV projects list | 46 | not checked |
| Add CV project modal | 47 | not checked |
| Update CV project modal | 48 | not checked |
| Remove CV project modal | 49 | not checked |
| User CVs list | not checked | 62 (light only) |
| Error page "Oops" | not checked | 00 (dark) |

## What the frames show for the Projects page

Page requirements: [docs/pages/27-projects-page.md](../../pages/27-projects-page.md).

- The description and the skill tags are on a second line. This line is as wide as the whole row and sits under the name, domain and dates. The tags are chips with a thin border and round ends.
- On the tablet, the Domain column is not shown. The description is cut after three lines and ends with an ellipsis. The create action is a plus icon without a text.
- The row menu (three dots) is at the end of the first line.
- The Create and Update project modals have the fields Name, Domain, Start Date, End Date, Description and Environment (skill chips that can be removed). The buttons are CANCEL and CREATE or UPDATE.
- The Delete project modal asks: "Are you sure you want to delete project {name}?" and has CANCEL and CONFIRM.
- Dates are in the month/day/year order. The Projects list has `12/31/2025` and `4/15/2025`. The CV projects list always has two digits (`08/21/2023`) and shows "Till now" for a project without an end date.

## Known issues

- **`tablet-768/dark` has no `frame-61.png` and no `frame-62.png`.** The Figma export did not contain them. Export them again from Figma if you need them.
- **Two extra tablet dark frames** came in the tablet archive with the file names `1440w dark.png` and `1440w dark-1.png`. They show the Settings page with the user menu open (wide sidebar and narrow sidebar). They are saved as `extra-settings-user-menu-wide-sidebar.png` and `extra-settings-user-menu-narrow-sidebar.png`. No light frame was matched to them.
- The Figma file itself is linked in the page documents, for example in `docs/pages/27-projects-page.md`.

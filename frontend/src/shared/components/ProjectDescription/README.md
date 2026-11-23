# ProjectDescription

The description text of a project in a table detail line. Used by the Projects list and the CV projects list.

- Props: `text`.
- On a tablet (up to 1023px) the CSS cuts the text after three lines with an ellipsis. When it is cut, a click (or Enter, Space) shows all of it and the next click cuts it again. When nothing is cut it is plain text with the normal cursor. `useClampedText` measures the text, also on a resize.
- Colour: `--color-text-secondary`. Figma draws the description in #919192 in both themes (contrast about 3:1 on the light page), so this is a decision: see the known issue in `features/cvs/README.md`.
- Known issue: it is a `<p role="button">` when cut. A real `<button>` would be cleaner.

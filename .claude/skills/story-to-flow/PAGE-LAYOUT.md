# Plan page layout

Worked example: the generators in `example/`, which build a sample plan page for a Projects search story. The page is the only file the skill creates.
Generator of the example: `example/build-plan-a4.mjs` (page, CSS, script), `example/glossary.mjs` (hover texts), `example/build-plan.mjs` (plain plans and steps as data). `build-charts.mjs` runs first and writes `<slug>-data-flow.html` (the base CSS and the chart); the others read it. Copy the three files, replace the content, keep the structure. Copy `example/env.mjs` (finds the output folder, the browser and the PDF reader for the system) and `example/verify-print.mjs` (the print check) with them. The generators import `env.mjs`, so keep it in the same folder. Run the generators from the repo root, or set `STORY_FLOW_OUT` to the output folder.

## Sheets, in this order

Every sheet is one A4 page. A sheet that holds long content is split, because a step is never cut across pages.

1. Cover: kicker, `h1` as the story title, chips (depends on, AC numbers marked "given" or "derived", docs, branch), one lead paragraph, contents list with page numbers, "How to use this page" box.
2. Three plans: child, non-programmer, web dev intern. Stacked in one column.
3. Flow chart (landscape): chart, caption, legend.
4. Architecture slice: a top-to-bottom stack. One box per layer: title, file path, one note on the right, a labelled arrow between layers. Zones for browser and backend.
5. Why the backend does the work: the question, a short answer, a worked example with invented names, reasons each tied to the repo or the story, "What we pay for this choice".
6. Alternatives: table with columns option, how it works, better at, worse here because, verdict. Then "When would the other option be right?" and a note that says what is reasoning and what is verified.
7. Steps, grouped by dependency ("Today", "After <dependency> is merged"). Each step: number, title, file paths as `code`, one paragraph, pseudo code in `pre`, tests in `pre`, done-when, commit idea. Split the sheets so that each fits one page (two or three steps, one when long).
8. Criteria check and open points.
9. Glossary: one table row per hover entry (name, kind, where, what). The code of an entry stays on screen only.

Footer of every sheet: `<slug> plan · sheet title` and `Page N`.

## Page form

One complete HTML file: `<!doctype html><html lang="en"><head>…</head><body>…</body></html>`. The doctype is required, because without it the browser uses quirks mode. The head holds `meta charset`, `meta viewport`, `<title>Story Title Plan A4</title>`, the font link and `<style>`. The body holds the tool bar, the sheets, `<div id="tip">` and one inline `<script>`. Escape `<`, `>` and `&` in code blocks. The file opens from disk in any browser. Nothing is published.

## A4 and print rules

- Screen: `.sheet` is 210 mm wide (297 mm for the landscape sheet), side padding 8 mm, narrower than 880 px it becomes fluid.
- Print: `@page { size: A4 portrait; margin: 12mm 9mm }`, a named page `land` for the chart (`A4 landscape`), `break-after: page` on each sheet, `print-color-adjust: exact`, tool bar and tip hidden.
- Code: `pre { white-space: pre-wrap; overflow-wrap: anywhere }` everywhere. A code block never scrolls sideways.
- Chart height in print: 140 mm. Stack diagram: width 100 %, at most 205 mm tall.

## Looks

Two looks, chosen by a switch (stored in `localStorage` with try/catch):
- Colour: the tokens of the example (light and dark with the system theme).
- Black and white: tokens through `html:root[data-look="bw"]`. Bold outline = new, thin outline = exists, dotted outline = not allowed. Headings underlined with a thick rule, tables with a thick header rule.
Print always uses the black and white tokens. Generate the token block and the rules once, and use them for both the switch and `@media print`.

## Hover boxes

- Text: `<span class="term" tabindex="0" data-t="key">word</span>`. Add a word to the term map and the generator wraps its first occurrence on each sheet. It skips `pre`, `svg` and `h1`.
- Chart: add `class="hot" tabindex="0" data-t="key"` to a bubble group, and `class="al hot"` plus `data-t` to an arrow label.
- Entry: `name`, `kind`, `what` (plain text), `where` (file or function names), `code` (real code or pseudo code). Use the real name or code from the repo and say "verified" in `what` only for facts read in this run. Mark pseudo code and guessed names.
- The script builds the box with `textContent`, never `innerHTML`. Open on hover, focus or tap. Close on Esc, scroll, or a click outside. Keep it open while the pointer is on it.

## Flow chart rules

One inline `<svg>` with a `viewBox`, inside a `div` with `overflow-x: auto` and `min-width: 900px` on the svg.

- Lanes as shaded zones: BROWSER (NEXT.JS), BACKEND (NESTJS), DATABASE. Add a band "WHAT THE ADMIN SEES" when the story has visible states.
- Bubble: `rect`, 150 by 56, `rx` 28. Title 13px sans, at most 18 characters. Sub line 10.5px mono, at most 20 characters.
- Bubble styles: solid = exists today; dashed teal = new in this story; dashed red = not allowed (in black and white: thin, bold, dotted).
- Arrows: straight lines with an arrowhead marker. Put a label beside every arrow that names the data it moves ("POST /graphql", "rows + total"). Keep labels off the line and out of the bubbles.
- Round trips draw as two arrows (request and response), 20px apart.
- A repeating action draws as a loop along the left edge.
- Colour only through the tokens. The chart must read in both looks and in dark mode.
- Draw a path the story forbids as a dashed arrow with a crossed circle on it.
- Do not run an arrow across a zone label. Put the label on the side that stays clear.

## Verify before publishing

Run the check from the repo root: `node <skill folder>/example/verify-print.mjs <output folder>/<slug>-plan-a4.print.html --screenshot <scratchpad>/top.png`. It finds a browser on this system (Edge, Chrome, Chromium and Brave print with the same flags), prints the file to PDF with a fresh browser profile, reads the text of each page and lists the pages. Exit code 0: every page has content. Exit code 1: a page holds only a footer (a sheet is too long) or the print failed. Exit code 2: no browser or no file. Expected: one page per sheet; the glossary may take two.

Tools by system. `node <skill folder>/example/env.mjs` shows what this system has and what to install.

| System | Browser | PDF text reader | If missing |
| --- | --- | --- | --- |
| Windows | Edge (comes with Windows) or Chrome | `pdftotext` from Poppler | `scoop install poppler`. Without it the check counts pages only. |
| macOS | Chrome, Edge, Chromium or Brave | built-in PDFKit, nothing to install | `brew install --cask google-chrome` |
| Linux | chromium, google-chrome or microsoft-edge | `pdftotext` | `sudo apt install chromium poppler-utils` |

Set `STORY_FLOW_BROWSER` to the browser file to choose a browser. Set `STORY_FLOW_OUT` to the output folder when a script runs from another folder. A script stops when `STORY_FLOW_SLUG` is missing.

Screenshots of single sheets: start the browser by hand, one sheet per file. Edge needs `--headless=old --screenshot`, because its new headless mode gives a blank image. Chrome 156 on macOS gave a correct image in both modes (checked, not assumed).

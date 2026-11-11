# ticket-to-plan

A Claude Code skill that turns a Jira ticket into one A4 plan page. Run it in Claude Code from the repo root:

```
/ticket-to-plan KAN-128
```

The page holds three plans (for a child, a non-programmer and a web dev intern), a flow chart, the architecture slice, the reason for the main design choice, alternatives, file-by-file steps with pseudo code, a criteria table, open points and a glossary. It has a colour look and a black and white look, and hover boxes on words and chart parts. It prints on A4. The skill writes the plan only: it writes no app code.

- **Steps and rules:** [SKILL.md](SKILL.md). **Page layout, print rules, chart rules:** [PAGE-LAYOUT.md](PAGE-LAYOUT.md).
- **Where the page goes:** `maciek/` when that folder exists, else `.ticket-plans/` in the repo root (git-ignored). Set `TICKET_PLAN_OUT` to use another folder. The page is a personal working file: do not commit it.
- **Writing rules:** the skill follows `maciek/MACIEK.md` when it exists, and the rules in `CLAUDE.md`. Without rules it writes plain English with short sentences and no analogies.
- **Used by:** Maciek and Rafal when they plan a ticket. Docs: [AGENTS.md](../../../AGENTS.md), [PLAN.md §5](../../../PLAN.md#5-development-rules).

## What it needs

Run `node .claude/skills/ticket-to-plan/example/env.mjs` to see what your system has. It prints an install hint for each missing tool.

| System  | Node | Browser (prints the PDF)                         | PDF text reader                       |
| ------- | ---- | ------------------------------------------------ | ------------------------------------- |
| macOS   | yes  | Chrome, Edge, Chromium or Brave                  | built in (PDFKit), nothing to install |
| Windows | yes  | Edge (comes with Windows) or Chrome              | `pdftotext` (`scoop install poppler`) |
| Linux   | yes  | chromium, google-chrome or microsoft-edge        | `pdftotext` (`apt install poppler-utils`) |

The Atlassian connector must be signed in, because the skill reads the ticket from Jira. Without a PDF text reader the print check counts pages only. Set `TICKET_PLAN_BROWSER` to the browser file to choose a browser.

## Files

- `example/build-charts.mjs`, `build-plan.mjs`, `build-plan-a4.mjs`, `glossary.mjs`: the generators of the KAN-128 plan page. They are the worked example. For a new ticket the skill copies them to the scratchpad and replaces the content.
- `example/env.mjs`: finds the output folder, the browser and the PDF reader for the system (Windows, macOS, Linux).
- `example/verify-print.mjs`: prints the page to PDF and lists the pages. Exit code 0: good. 1: a page holds only a footer, or the print failed. 2: no browser or no file.

## Known limits

- Tested on macOS (Chrome 156, built-in PDFKit). The Windows and Linux paths follow standard install locations and were not run.
- The generators are plain JavaScript (`.mjs`), not TypeScript. They are standalone tools outside the app, but AGENTS.md says "No `.js` files". Convert them to TypeScript if the team wants to follow the rule here too.
- The worked example describes the repo as it was on 2026-11-10 (for example KAN-127 not merged). A new run re-reads Jira and the repo.

---
name: story-to-flow
description: Turn a user story into one A4 plan page: three plain-language plans, a flow chart, and file-by-file steps with pseudo code. Needs no Jira ticket.
disable-model-invocation: true
---

# Story to flow

Input: a user story (`$ARGUMENTS`). It is the text itself, or the path of a text file that holds it. Example: "As an admin, I want to search the Projects list, so that I find a project fast." The story can also list acceptance criteria (AC).
Output: one file, `<output folder>/<slug>-plan-a4.print.html`. It is a complete HTML page for the browser and for printing on A4. The page has two looks (colour, black and white) and hover explanations. Create no other file and publish no Artifact.

The slug is the story title in lowercase words joined with hyphens. Use the action and its object, at most 5 words (example: `projects-search`). Set `STORY_FLOW_SLUG` to it before every script. The scripts stop when it is missing.
The output folder is `maciek/` when that folder exists, else `.ticket-plans/` in the repo root (git-ignored). `STORY_FLOW_OUT` overrides both.

The developer writes the code. Produce the plan only, with no app code and no edits outside the output folder.
Follow the writing rules of the person who runs the skill: read `maciek/MACIEK.md` when it exists, and follow the rules in `CLAUDE.md`. Without such rules, write plain English with short sentences, no analogies, and explain each action. Maciek's rules apply to the whole page: ASD-STE100 language, no analogies, each action explained.

## Before you start: check the input and the tools

- `$ARGUMENTS` is empty: ask for the story. Stop until it arrives.
- `$ARGUMENTS` is a Jira key such as `KAN-128`: tell the user to run `/ticket-to-plan` for it, because this skill reads no Jira. Stop.
- The skill folder is the folder of this `SKILL.md`. The generators and the print check are in its `example/` folder. Work from the repo root.
- Run `node <skill folder>/example/env.mjs`. It reports the system, the browser, the PDF reader and the output folder, and prints what to install for the system that is running (Windows, macOS or Linux).
- Browser MISSING: stop. Tell the user the install hint from the report. Nothing in the plan needs the browser before step 9, but step 9 cannot finish without it.
- PDF reader MISSING: go on. The print check then counts pages only. Say this in the answer of step 10.
macOS needs neither Edge nor `pdftotext`: Chrome prints the page, and the built-in PDF reader reads it. This skill needs no Atlassian connector.

## Steps

1. **Read the story.**
   Call no Jira or Confluence tool. The story is the only source of scope.
   Find the actor, the action and the reason. List the AC as AC-1, AC-2 and so on. Mark each AC "given" (the story states it) or "derived" (you wrote it from the words of the story).
   - The story has no AC: derive them from its own words, and mark them all "derived".
   - A sentence in the story supports no AC: leave it out of the AC list and put it under "Open points".
   - The actor or the reason is missing: write the missing part under "Open points", state your assumption, and go on.
   - The story has no action: ask for one. Stop until it arrives.
   Done when you hold: the actor, the action, the reason, the slug, the numbered AC list with a mark on each, and every dependency that the user named.

2. **Read the page document.**
   Search `docs/pages/` for the screen that the story names. Open only the file that matches (AGENTS.md rule). Open its image only when layout details matter.
   - No file matches: write "no page document" under "Open points". Label every statement "story only".
   Done when each AC matches a sentence of the document, or is listed under "Open points" as "not in the page document".

3. **Check the repo for every scope item.** A scope item is one part of the action that the story names.
   - Read the README of each shared component or backend module the scope touches, and one neighbouring feature for conventions (for example `frontend/src/features/sign-in/`). A shared component often covers part of the scope already.
   - Check each dependency that the story or the user named: `git branch -a` and `gh pr list --state all --search <dependency name>`. A dependency that is not on `development` is "not merged".
   - The story names no dependency: write "none named". Then check that the repo holds what each scope item needs. List any missing piece under "Open points" as a possible dependency.
   Done when every scope item is labelled **exists** or **new** with a file path as evidence, and every named dependency is labelled **merged** or **not merged**.

4. **Write three plans.** Each plan holds the same three facts: what we build, why it matters, when it is done.
   - Child: at most 8 short sentences, words a 7-year-old knows, no technical terms.
   - Non-programmer: what the user sees and does, what changes for them, the risk. No code words.
   - Web dev intern: technical terms allowed. Explain each React, TypeScript or GraphQL idea in one sentence the first time it appears. Name the PLAN.md rule behind each design choice.
   Done when each plan holds the three facts and no analogy.

5. **Write the steps.** One step per unit of work, in build order. Each step has: number, title, file path(s), what the file holds, pseudo code, the tests to write, a done-when line, and a commit idea (conventional header, no quotes, no ticket key) for every step that finishes a unit.
   - Use the branch name `feature/<slug>`.
   - Order the steps new-files-first. Group them as "no dependency" and "after the dependency is merged" only when step 3 found a named dependency that is not merged.
   - Place every file with PLAN.md section 3 and AGENTS.md: a file with a test is a folder (`X/` with `X.ts`, `X.test.ts`, `index.ts`); one responsibility per file; children live inside the parent.
   - Verify every import in the pseudo code by reading the `index.ts` of its source folder.
   Done when every scope item and every AC maps to at least one step (this becomes the criteria table) and every import is verified.

6. **Draw the flow chart.** Follow the chart rules in `PAGE-LAYOUT.md`.
   Done when every arrow carries the name of the data it moves and every dashed bubble matches a step.

7. **Write the explainer.** Three parts, each tied to this story.
   - Architecture slice: one box per layer the story touches, with the file path of each layer and the label of the data between layers.
   - Why: the question a newcomer asks about the main design choice of the story (for a Projects search story: why the browser does not sort), a short answer, a worked example with invented names, and reasons. Tie each reason to a repo file or an AC number.
   - Alternatives: at least five real options. For each: how it works, what it does better, why it is worse in this project, a verdict. Add when the rejected option would be right.
   Done when every reason names a repo file or an AC, and every statement from general knowledge is labelled "reasoning".

8. **Write the glossary.** One entry for each tool, library, protocol or project-specific function that the page names (examples: Prisma, PostgreSQL, GraphQL, the request, the state-to-variables function). Fields: `name`, `kind`, `what`, `where`, `code`. Read the real file for each entry that names project code.
   Done when every bubble and arrow label of the chart, and every box of the stack, has an entry, and each `where` item exists in the repo or is marked "planned".

9. **Build and verify.** The generators in `example/` build a sample plan page for a Projects search story. It names `KAN-127` as its sample dependency. Copy `example/` to the scratchpad and replace the content: the plans, steps, chart and glossary. Make an empty folder `<scratchpad>/plan-out` for the helper files. From the repo root run, in this order:
   1. `STORY_FLOW_OUT=<scratchpad>/plan-out STORY_FLOW_SLUG=<slug> node <scratchpad>/example/build-charts.mjs` (writes the base chart file).
   2. `STORY_FLOW_OUT=<scratchpad>/plan-out STORY_FLOW_SLUG=<slug> node <scratchpad>/example/build-plan-a4.mjs` (writes `<slug>-plan-a4.print.html`).
   3. `node <scratchpad>/example/verify-print.mjs <scratchpad>/plan-out/<slug>-plan-a4.print.html --screenshot <scratchpad>/top.png`.
   In Windows PowerShell set the variables first: `$env:STORY_FLOW_OUT = "<scratchpad>\plan-out"` and `$env:STORY_FLOW_SLUG = "<slug>"`.
   Take a screenshot of the chart sheet in both looks (see `PAGE-LAYOUT.md`). Copy only the print file to the output folder (`node <skill folder>/example/env.mjs` shows it). The helper files stay in the scratchpad, because this skill creates one file.
   Done when the PDF has one page for each sheet, no page that holds only a footer, no code block that scrolls sideways, and the file exists in the output folder.

10. **Answer in at most 6 lines:** the path of the print file (open it in the browser, press Ctrl+P, or Cmd+P on a Mac), what exists versus what is new, what blocks the story, and the decisions the team must make. Name every "derived" AC for the user to confirm. If the user's rules ask for a diary or notes, offer that entry.

## Facts from the code only

Mark a fact as verified only when you read it in the repo during this run. The story is the only source of scope, so a statement that the story does not make is an assumption. List every assumption and every other unverified statement under "Open points", with the file to check. In the hover texts and the explainer, a statement from general knowledge says "reasoning" or "example, not measured".

Reference: [PAGE-LAYOUT.md](PAGE-LAYOUT.md) (sheets, A4 and print rules, looks, hover boxes, chart rules, verification), [README.md](README.md) (use, tools by system). Worked example: the generators in `example/`. Its cover shows a story title and no Jira chips.

// Builds <output folder>/<slug>-plan.html. Reuses the style and the chart of <slug>-data-flow.html.
// build-plan-a4.mjs reads the data of this file (plans, steps, criteria, open points) by cutting the source text.
import { readFileSync, writeFileSync } from "node:fs";
import { outDir, slug } from "./env.mjs";

const OUT = outDir();
const SLUG = slug();
const base = readFileSync(`${OUT}/${SLUG}-data-flow.html`, "utf8");

const baseCss = base
  .match(/<style>([\s\S]*?)<\/style>/)[1]
  .replace("--rule: #d6dae3;", "--rule: #d6dae3; --code-bg: #eceef3;")
  .replaceAll("--rule: #2b3244;", "--rule: #2b3244; --code-bg: #0d1017;");
const chart = base.match(/<div class="scroll">[\s\S]*?<\/div>(?=\n<figcaption>)/)[0];

const EXTRA_CSS = `
.jump { display: flex; flex-wrap: wrap; gap: 8px; }
.jump a { border: 1px solid var(--rule); background: var(--card); color: var(--fg); border-radius: 999px; padding: 5px 14px; font-size: 13px; text-decoration: none; }
.jump a:hover, .jump a:focus-visible { border-color: var(--new); outline: none; }
.plans { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 330px), 1fr)); gap: 16px; }
.plan { border: 1px solid var(--rule); background: var(--card); border-radius: 8px; padding: 18px 20px; display: grid; gap: 10px; align-content: start; min-width: 0; }
.plan h3 { font: 500 12px var(--mono); letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin: 0; }
.plan p, .plan ul { margin: 0; }
.plan ul { padding-left: 18px; display: grid; gap: 4px; }
.group { display: grid; gap: 0; }
.group > h3 { font: 500 12px var(--mono); letter-spacing: 0.1em; text-transform: uppercase; color: var(--new); margin: 18px 0 4px; }
.step { display: grid; grid-template-columns: 40px minmax(0, 1fr); gap: 0 12px; padding: 18px 0; border-top: 1px solid var(--rule); }
.step .no { font: 600 14px var(--mono); color: var(--muted); padding-top: 2px; }
.step h4 { margin: 0 0 6px; font-size: 16px; font-weight: 600; }
.step p { margin: 0 0 8px; }
.step .files { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 8px; padding: 0; list-style: none; }
.step .done { color: var(--muted); font-size: 14px; }
.step .done b { color: var(--fg); font-weight: 600; }
pre { background: var(--code-bg); border: 1px solid var(--rule); border-radius: 6px; padding: 12px 14px; overflow-x: auto; font: 12.5px/1.55 var(--mono); margin: 8px 0; max-width: 100%; }
pre code { border: 0; background: none; padding: 0; font: inherit; overflow-wrap: normal; }
.tw { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; font-size: 14px; }
th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--rule); vertical-align: top; }
th { font: 500 12px var(--mono); letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
.cols.one { grid-template-columns: 1fr; }
`;

const esc = (s) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const pre = (code) => `<pre><code>${esc(code.trim())}</code></pre>`;
const code = (s) => `<code>${s}</code>`;
const P = "frontend/src/features/projects";
const H = `${P}/useProjectsQueryState`;

/* ------------------------------------------------------------ plain plans */
const child = `
<p>A list of projects is on the screen. Today we can only look at the list.</p>
<p>We want to add three things.</p>
<ul>
<li>We type a word. The list shows only the projects with that word.</li>
<li>We click a title. The list changes its order, for example from A to Z.</li>
<li>We press a button. We see the next part of a long list.</li>
</ul>
<p>A big computer keeps all the projects. It does the finding and the ordering. The screen only asks the computer and shows the answer.</p>
<p>We are done when the three things work, and they work together.</p>`;

const nonProg = `
<p>Today the administrator sees a list of projects and cannot do much with it. This work adds three tools to the list.</p>
<ul>
<li><b>Search.</b> The administrator types a part of a project name or a domain. The list shows only the matching projects. Capital letters do not matter.</li>
<li><b>Sort.</b> The administrator clicks the column title Name, Start date or End date. The list changes its order. A small arrow shows the direction. A third click removes the sorting.</li>
<li><b>Pages.</b> The list shows 10 projects at a time. When there are more projects, page buttons appear below the list.</li>
</ul>
<p>The search and the sorting happen in the database, not on the screen. This is important. It means the tools work on all projects, not only on the 10 that the administrator sees.</p>
<p>Search and sort work together. A new search or a new sort always goes back to page 1.</p>
<p><b>This work is done when</b> the administrator can search, sort and change page on the real Projects page, and the screen never sorts or filters the list by itself.</p>
<p><b>Risks:</b> the real Projects page still shows only a title, so the team must agree who builds it (step 1). The test data has 6 projects, so the page buttons show only after someone adds 5 more.</p>`;

const intern = `
<p>The projects table (KAN-127) shows rows from a GraphQL query. This story adds three inputs to it: ${code("search")}, ${code("sort")} and ${code("page")}. The backend filters, sorts and cuts pages in ${code("ProjectsService.list")}, and it already works. The query already has the three variables. Nothing in the browser filters or sorts rows.</p>
<p>Your job: keep three values in state, send them as variables, and show the answer with the shared ${code("SearchField")}, ${code("DataTable")} and ${code("Pagination")}.</p>
<ul>
<li><b>Controlled components.</b> ${code("DataTable")} and ${code("Pagination")} show what you give them and report clicks through callbacks. The page owns the state (PLAN 5.1, 5.2).</li>
<li><b>Variables.</b> When a variable of ${code("useQuery")} changes, Apollo Client sends a new request. You never call ${code("fetch")}.</li>
<li><b>Pure functions.</b> They return a result from their input and change nothing else. Test them first (PLAN 5.8). A custom hook, ${code("useProjectsQueryState")}, keeps the state (PLAN 5.2).</li>
<li><b>Reset to page 1.</b> A new search or sort goes back to page 1, because page 3 may not exist in the new result.</li>
<li><b>Page size.</b> Always send 10 (${code("DEFAULT_PAGE_SIZE")}, PLAN D19). The backend default is 20.</li>
</ul>
<p><b>Where you start:</b> your branch holds the KAN-127 table and hook, but not the page that shows them. Step 1 builds the page. Steps 2 to 5 are new files with tests.</p>`;

/* ------------------------------------------------------------------ steps */
const steps = [
  { group: "Before this story: the table must be on the real page" },
  {
    n: 1,
    title: "Put the table on the Projects page",
    files: [
      `${P}/Projects.tsx`,
      `${P}/useProjectsPage/useProjectsPage.ts`,
      `${P}/useProjectsPage/useProjectsPage.test.tsx`,
      `${P}/index.ts`,
      "frontend/src/app/[locale]/(app)/admin/projects/page.tsx",
      `${P}/messages/en.json and pl.json`,
    ],
    what: "The route still shows only a heading (verified). KAN-127 asked for the table on the page and for an error state with Retry (AC-39), so this is the end of KAN-127. Build it on the projects-list branch, then put the branch of this story on top. Both branches are at the same commit today (363607f), so the rebase has no conflicts while this story has no commits of its own. Ask the team first if somebody else already built this page.",
    code: `git switch feature/projects-list
# build and commit step 1 here
git switch feature/projects-search-sort-pagination
git rebase feature/projects-list

// useProjectsPage/useProjectsPage.ts   (container hook, PLAN 5.2)
function useProjectsPage():
  { rows, total, loading, error, refetch } = useProjects()
  return { rows, loading, error, retry: refetch }

// Projects.tsx   (the container: calls the hook, wires the result)
function Projects():
  t = useTranslations("projects")
  { rows, loading, error, retry } = useProjectsPage()
  if error -> return <PageState kind="error" onRetry={retry}
                 labels={{ error: t("error"), retry: t("retry") }} />
  return <>
    <h1>{t("title")}</h1>
    <ProjectsTable rows={rows} loading={loading} />
  </>

// index.ts
export { Projects } from "./Projects"

// app/[locale]/(app)/admin/projects/page.tsx
import { Projects } from "@/features/projects"
return <main><Projects /></main>`,
    test: `Tests to write (renderWithProviders and a mocked Apollo link):
- while the answer is on its way -> the loading skeleton shows
- the mock returns 2 projects -> both names show
- the mock fails -> the error text and a Retry button show, no empty list
- click Retry -> the query runs again and the rows show`,
    done: "<b>Done when:</b> <code>/en/admin/projects</code> shows the real list in the browser, and lint, typecheck and tests pass. <b>Commit idea:</b> <code>feat(frontend): show the projects table on the admin page (KAN-127)</code>",
  },

  { group: "This story part 1: new files, no page needed" },
  {
    n: 2,
    title: "Describe the state with one type",
    files: [`${H}/projects-query.types.ts`],
    what: "A file without a test stays a plain file. It holds the shape of the three values. The shape of the variables comes from codegen: ProjectsQueryVariables exists (verified in the generated file) with a required page and an optional search and sort. Do not write it again by hand.",
    code: `import type { SortState } from "@/shared/components";

export interface ProjectsQueryState {
  search: string;               // text of the search box, "" when empty
  sort: SortState | undefined;  // undefined = no sort chosen, the backend uses name ascending
  page: number;                 // starts at 1
}`,
    done: "<b>Done when:</b> <code>pnpm --filter @cv-builder/frontend typecheck</code> passes. <b>Commit idea:</b> <code>feat(frontend): add the projects query state type</code>",
  },
  {
    n: 3,
    title: "Write the pure functions, and their test first",
    files: [
      `${H}/utils/projects-query.utils.ts`,
      `${H}/utils/projects-query.utils.test.ts`,
      `${H}/utils/index.ts`,
    ],
    what: "A file with a test is a folder. The functions take a state and return a new state. They change nothing else. Write the test file first, then the functions. DEFAULT_PAGE_SIZE and getPageCount come from the Pagination folder (verified in its index.ts). getPageCount returns 0 when there are no rows (verified), so the last page is at least 1.",
    code: `import { DEFAULT_PAGE_SIZE, getPageCount } from "@/shared/components/Pagination";
import type { ProjectsQueryVariables } from "@/shared/graphql";

export const INITIAL_PROJECTS_QUERY_STATE = { search: "", sort: undefined, page: 1 };

function toVariables(state): ProjectsQueryVariables
  variables = { page: { number: state.page, size: DEFAULT_PAGE_SIZE } }
  text = state.search.trim()
  if text is not empty  -> variables.search = text      // leave the key out when empty
  if state.sort exists  -> variables.sort = state.sort  // leave the key out when empty
  return variables

function withSearch(state, search) -> { ...state, search, page: 1 }   // new search: page 1
function withSort(state, sort)     -> { ...state, sort, page: 1 }     // new sort: page 1
function withPage(state, page)     -> { ...state, page }              // search and sort stay

function clampPage(state, total):
  last = max(1, getPageCount(total, DEFAULT_PAGE_SIZE))
  if state.page > last -> return { ...state, page: last }
  return state                                            // the SAME object when nothing changes`,
    test: `Tests to write:
- initial state -> variables have page 1, size 10, and no "search" and no "sort" key
- search "  ada  " -> variables.search is "ada"; search "   " -> no "search" key
- sort { field: "name", direction: "ASC" } is passed through
- withSearch and withSort set page back to 1; withPage keeps search and sort
- clampPage: page 5 with total 12 -> page 2; total 0 -> page 1; page inside the range -> same object (toBe)`,
    done: "<b>Done when:</b> <code>pnpm --filter @cv-builder/frontend test</code> passes. <b>Commit idea:</b> <code>feat(frontend): add pure helpers for the projects query state</code>",
  },
  {
    n: 4,
    title: "Write the hook, and its test",
    files: [`${H}/useProjectsQueryState.ts`, `${H}/useProjectsQueryState.test.ts`, `${H}/index.ts`],
    what: "The hook holds the state and gives the page four actions. The clampPage rule is the reason for returning the same object: React skips the render when the state is the same, so syncTotal cannot start a loop.",
    code: `export function useProjectsQueryState() {
  const [state, setState] = useState(INITIAL_PROJECTS_QUERY_STATE)

  const variables = useMemo(() => toVariables(state), [state])

  const setSearch = useCallback((search) => setState((c) => withSearch(c, search)), [])
  const setSort   = useCallback((sort)   => setState((c) => withSort(c, sort)), [])
  const setPage   = useCallback((page)   => setState((c) => withPage(c, page)), [])
  // The page calls this when an answer arrives. A page past the end moves back to the last page.
  const syncTotal = useCallback((total)  => setState((c) => clampPage(c, total)), [])

  return { state, variables, setSearch, setSort, setPage, syncTotal }
}`,
    test: `Tests to write (renderHook and act come from "@/shared/testing"):
- first render: variables = page 1, size 10 only
- setSearch("ada") -> variables.search is "ada" and page is 1
- setPage(3), then setSort(...) -> page is back to 1
- setPage(5), then syncTotal(12) -> page is 2`,
    done: "<b>Done when:</b> the test passes. <b>Commit idea:</b> <code>feat(frontend): add the useProjectsQueryState hook</code>",
  },
  {
    n: 5,
    title: "Run the checks and stage the files",
    files: [],
    what: "Run each check from the repo root. Fix what they report. Then stage only the new files and ask Claude for the commit messages.",
    code: `pnpm --filter @cv-builder/frontend lint\npnpm --filter @cv-builder/frontend typecheck\npnpm --filter @cv-builder/frontend test\npnpm format:check`,
    done: "<b>Done when:</b> all four commands pass.",
  },

  { group: "This story part 2: connect the pieces (needs step 1)" },
  {
    n: 6,
    title: "Let useProjects take the variables",
    files: [`${P}/useProjects/useProjects.ts`, `${P}/useProjects/useProjects.test.tsx`],
    what: "The hook exists (verified). It sends a fixed page 1 with DEFAULT_PAGE_SIZE and returns rows, total, loading, error and refetch. Now it gets the variables as an argument. Remove the fixed variables: toVariables adds the page size. A change of a variable makes Apollo ask the backend again.",
    code: `export function useProjects(variables: ProjectsQueryVariables) {
  const { data, loading, error, refetch } = useQuery(ProjectsDocument, { variables })
  return {
    rows: data?.projects.items ?? [],
    total: data?.projects.total ?? 0,
    loading, error, refetch,
  }
}`,
    test: `Tests to change and add:
- the Probe component passes variables as a prop; every existing test passes page 1, size 10
- new test: render with { page 1 }, then re-render with { page 2, search "ada" }
  -> the second mock answers (it matches only those variables) and rows change
- refetch after an error keeps the same variables`,
    done: "<b>Done when:</b> the hook tests pass. <b>Commit idea:</b> <code>feat(frontend): let useProjects take the query variables</code>",
  },
  {
    n: 7,
    title: "Make three columns sortable",
    files: [
      `${P}/components/ProjectsTable/ProjectsTable.tsx`,
      `${P}/components/ProjectsTable/ProjectsTable.test.tsx`,
      `${P}/components/ProjectsTable/ProjectsTable.stories.tsx`,
    ],
    what: "The table is representational, so it gets two new props and passes them on. DataTable shows a sort button only for a column with a sortField when onSortChange is given (verified in DataTable.tsx). The backend accepts exactly name, startDate and endDate (verified in projects.service.ts). A third prop picks the empty message: PageState keeps empty and no-results apart (verified in its README), and the page document gives the same text for both.",
    code: `interface ProjectsTableProps {
  rows, loading?,
  sort?: SortState | undefined,
  onSortChange?: (sort: SortState | undefined) => void,
  searching?: boolean,                 // true when the search box is not empty
}

columns:
  name    -> { ..., sortField: "name" }
  domain  -> no sortField
  start   -> { ..., sortField: "startDate" }
  end     -> { ..., sortField: "endDate" }

<DataTable ... sort={sort} onSortChange={onSortChange}
  emptyContent={<PageState kind={searching ? "no-results" : "empty"}
                  labels={{ empty: t("empty"), noResults: t("empty") }} />} />`,
    test: `Tests and story to write:
- sort buttons exist for Name, Start Date and End Date, and not for Domain
- click Name -> onSortChange gets { field: "name", direction: "ASC" }
- sort = { field: "name", direction: "ASC" } -> the Name header has aria-sort="ascending"
- without onSortChange no header is a button (the old tests keep passing)
- searching and no rows -> the message shows
- story "Sorted": the Name header is marked ascending`,
    done: "<b>Done when:</b> the tests and the story pass. <b>Commit idea:</b> <code>feat(frontend): make the projects columns sortable</code>",
  },
  {
    n: 8,
    title: "Connect the state, the search box, the table and the page buttons",
    files: [
      `${P}/Projects.tsx`,
      `${P}/useProjectsPage/useProjectsPage.ts`,
      `${P}/messages/en.json`,
      `${P}/messages/pl.json`,
    ],
    what: "The container hook joins the two hooks. The component only receives props and renders (PLAN 5.1). SearchField is not controlled: defaultValue sets the first text only (verified in its README). The backend allows 100 characters for the search and trims it (verified in list.args.ts), so the field gets maxLength 100. The shared components have English default texts, so the page passes translated ones. Pagination labels have the keys navigation, previous, next and page(number) (verified in Pagination.types.ts).",
    code: `// useProjectsPage (the version of step 1, extended)
const { state, variables, setSearch, setSort, setPage, syncTotal } = useProjectsQueryState()
const { rows, total, loading, error, refetch } = useProjects(variables)
useEffect(() => { if (!loading && !error) syncTotal(total) }, [loading, error, total, syncTotal])
return { state, rows, total, loading, error, retry: refetch, setSearch, setSort, setPage }

// Projects.tsx
<SearchField label={t("search.label")} placeholder={t("search.placeholder")}
             maxLength={100} defaultValue={state.search} onSearch={setSearch} />
<ProjectsTable rows={rows} loading={loading} sort={state.sort} onSortChange={setSort}
               searching={state.search.trim() !== ""} />
<Pagination page={state.page} total={total} onPageChange={setPage}
            labels={{ navigation: t("pagination.navigation"), previous: t("pagination.previous"),
                      next: t("pagination.next"), page: (number) => t("pagination.page", { number }) }} />

// messages  en                                       pl
// search.label       Search projects                  Szukaj projektów
// search.placeholder Search                           Szukaj
// pagination.navigation Pagination                    Paginacja
// pagination.previous   Previous page                 Poprzednia strona
// pagination.next       Next page                     Następna strona
// pagination.page       Page {number}                 Strona {number}`,
    done: "<b>Done when:</b> you can search, sort and change page in the browser, both language files have the same keys, and <code>No projects found</code> shows when a search has no result. A Retry after an error keeps the search and the sort (page document, Error State).",
  },
  {
    n: 9,
    title: "Write the page tests",
    files: [`${P}/Projects.test.tsx`],
    what: "Use renderWithProviders and a mocked Apollo link; the pattern is in useProjects.test.tsx and useSignIn.test.tsx. The mock answers only a request with exactly the variables it lists, so a wrong variable shows as a failing test. SearchField waits 300 ms, so use fake timers or waitFor.",
    test: `Tests to write:
1. type "ada" -> the query gets search "ada" and page 1
2. click the Name header -> sort name ASC; click again -> DESC; click again -> no sort key
3. click Start Date after Name -> the sort changes to startDate
4. click page 2 -> page.number is 2; then search -> page.number is 1
5. the mock returns rows in the order Z, A -> the table shows Z, then A (proves no sorting in the browser)
6. every request has page.size 10
7. a search with no result -> "No projects found" shows
8. the query fails, then Retry -> the same search and sort are sent again`,
    done: "<b>Done when:</b> the tests pass and lint and typecheck pass. <b>Commit idea:</b> <code>feat(frontend): connect search, sort and pages on the projects page</code>",
  },
  {
    n: 10,
    title: "Add a story of the page (optional)",
    files: [`${P}/Projects.stories.tsx`],
    what: "A story shows the page with fake answers. Storybook takes GraphQL answers from parameters.apollo.mocks (verified in .storybook/README.md). Check it at the two sizes of the viewport menu, 768 and 1440 pixels.",
    code: `export const Default = { parameters: { apollo: { mocks: [ { request: {...page 1, size 10}, result: {...} } ] } } }`,
    done: "<b>Done when:</b> the story renders and its accessibility check passes.",
  },
  {
    n: 11,
    title: "Check by hand",
    files: ["backend/prisma/seed/projects.data.ts (read only)"],
    what: "The seed has 6 projects (verified), so with size 10 the page buttons never show. Add at least 5 more projects with the createProject mutation in the GraphQL playground (http://localhost:4000/graphql), or ask the team to extend the seed. Then try search, sort and pages together, with the keyboard too. The admin login is in backend/prisma/seed/credentials.ts (not read in this run).",
    done: "<b>Done when:</b> 11 or more projects show 2 pages, a search goes back to page 1, and a sort keeps the search.",
  },
  {
    n: 12,
    title: "Update the notes and open the pull request",
    files: [`${P}/README.md`, "PLAN.md (progress row of S5.5)"],
    what: 'AGENTS.md asks for a short README in every feature folder: purpose, exports, where it is used and the docs link. Update the S5.5 row in PLAN.md. In the pull request say "contract unchanged": schema.gql does not change. PLAN 5.11 says a branch starts from development and the pull request goes into development, but this branch starts from the projects-list branch. Decide the base of the pull request first (see Open points).',
    done: "<b>Done when:</b> the pull request is open.",
  },
];

const stepHtml = steps
  .map((s) => {
    if (s.group) return `<h3>${s.group}</h3>`;
    return `<div class="step"><div class="no">${s.n}</div><div>
<h4>${s.title}</h4>
${s.files.length ? `<ul class="files">${s.files.map((f) => `<li>${code(f)}</li>`).join("")}</ul>` : ""}
<p>${s.what}</p>
${s.code ? pre(s.code) : ""}${s.test ? pre(s.test) : ""}
<p class="done">${s.done}</p></div></div>`;
  })
  .join("\n");

const acRows = [
  [
    "AC-6",
    "Search filters by name and domain",
    "3, 8, 9",
    "Backend verified: <code>contains</code> on name or domain. The frontend sends the text.",
  ],
  [
    "AC-7",
    "Search is not case sensitive",
    "none",
    "Backend only (<code>mode: insensitive</code>, verified in <code>projects.service.ts</code>).",
  ],
  [
    "AC-8",
    "Search runs on the backend",
    "3, 6, 9",
    "The text goes in the variables. Tests 1 and 5 prove it.",
  ],
  [
    "AC-9, 10, 11",
    "Sort by Name, Start Date, End Date, both directions",
    "7, 8, 9",
    "<code>sortField</code> on three columns. Tests 2 and 3.",
  ],
  ["AC-12", "Sorting runs on the backend", "3, 6, 9", "Test 5: rows keep the backend order."],
  [
    "Scope: pagination",
    "Page buttons; search and sort work together",
    "3, 4, 8, 9",
    "No AC number in the story, and the Projects page document has no pagination text. Tests 4 and 6.",
  ],
  [
    "Done when",
    "The frontend never filters or sorts loaded rows",
    "9",
    "Test 5. There is no <code>.filter()</code> or <code>.sort()</code> in the plan.",
  ],
];

const open = [
  "<b>The dependency has no pull request.</b> There is no pull request or GitHub branch for KAN-127. The work exists only on the local projects-list branch, and the page still shows only a heading (all verified). Ask who owns it, and if another copy exists.",
  "<b>Who builds the page (step 1)?</b> It belongs to KAN-127 (its scope names the page, and AC-39 asks for Retry). If the team wants it in this story, move step 1 into the this story branch.",
  "<b>Pull request base.</b> The branch of this story starts from the projects-list branch (same commit 363607f). A pull request into <code>development</code> shows the KAN-127 commits too. Merge KAN-127 first, or use the projects-list branch as the base.",
  "<code>DataTable</code> cycles a sort click as none, ASC, DESC, none (verified in its README). The story names only ASC and DESC. With no sort the backend uses Name A to Z, but the table shows no arrow. Ask if the cycle must skip none.",
  '<b>Reset to page 1 and page size 10.</b> The Projects document has neither (no pagination text at all). The Users document says it (<code>docs/pages/10-users-page.md</code>), PLAN lists it as an open item of S1.2a, and D19 sets 10 with "Not in docs". This plan follows them.',
  "<code>SearchField</code> waits 300 ms (the code treats this as a guess, not from the docs). Confirm it. A future Clear button must remount the field, because it is not controlled.",
  "<b>Loading between requests.</b> New variables can leave <code>data</code> empty, so the table shows its Loading content on each change. The Apollo page I read says only that <code>previousData</code> holds the earlier result. Check the Apollo Client 4 docs on it before you decide (reasoning, not verified).",
  "<b>Test data.</b> The seed has 6 projects, so the page buttons never show with size 10. Extend the seed in a separate story (it also touches the e2e tests and the CV seed dates, D25), or add projects by hand (step 11).",
  "The effect in step 8 copies <code>total</code> into state. It is safe, because <code>clampPage</code> returns the same object. The React 19 lint rules may report it. If a reviewer dislikes it, compute the shown page from <code>total</code>.",
  "<b>Not read in this run:</b> the admin login in <code>backend/prisma/seed/credentials.ts</code>, and the e2e folder. Read them before step 11.",
];

const html = `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Projects Search Plan</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;600&display=swap">
<style>${baseCss}${EXTRA_CSS}</style>
<div class="wrap">
<header>
<p class="kicker">Plan · three readers, one flow, twelve steps</p>
<h1>Projects search, sort and pagination</h1>
<ul class="chips">
<li><b>Depends on</b> KAN-127 (code on the projects-list branch, not merged)</li>
<li><b>Acceptance criteria</b> 6 to 12</li>
<li><b>Branch</b> <code>feature/projects-search-sort-pagination</code></li>
</ul>
</header>
<nav class="jump" aria-label="Sections"><a href="#plans">Three plans</a><a href="#flow">Flow chart</a><a href="#steps">Steps</a><a href="#ac">Criteria check</a><a href="#open">Open points</a></nav>

<section id="plans">
<h2>Three plans, one for each reader</h2>
<div class="plans">
<article class="plan"><h3>For a child</h3>${child}</article>
<article class="plan"><h3>For a non-programmer</h3>${nonProg}</article>
<article class="plan"><h3>For a web dev intern</h3>${intern}</article>
</div>
</section>

<section id="flow">
<h2>Flow chart</h2>
<figure>
${chart}
<figcaption>Every search, sort or page change sends new variables to the backend. The backend does the work and the table shows the rows as they arrive. The red path is the story rule: the browser never filters or sorts the rows it already has.</figcaption>
<ul class="legend">
<li><span class="sw"></span>Exists today</li>
<li><span class="sw new"></span>New in this story</li>
<li><span class="sw no"></span>Not allowed</li>
</ul>
</figure>
</section>

<section id="steps" class="group">
<h2>Steps: which file, and what goes in it</h2>
<p>The pseudo code shows the idea. It is not final code. Write the real code yourself, run the checks, and ask Claude for a commit message after each step you want to commit.</p>
${stepHtml}
</section>

<section id="ac">
<h2>Criteria check</h2>
<div class="tw"><table>
<thead><tr><th>Criterion</th><th>What it says</th><th>Steps</th><th>Note</th></tr></thead>
<tbody>${acRows.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join("")}</tbody>
</table></div>
</section>

<section id="open" class="open">
<h2>Open points</h2>
<ul class="plain">${open.map((o) => `<li>${o}</li>`).join("")}</ul>
</section>
</div>
`;

writeFileSync(`${OUT}/${SLUG}-plan.html`, html);
console.log("written", html.length);

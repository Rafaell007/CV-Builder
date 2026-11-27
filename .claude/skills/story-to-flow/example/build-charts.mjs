// Builds the base chart <output folder>/<slug>-data-flow.html.
import { writeFileSync } from "node:fs";
import { outDir, slug } from "./env.mjs";

const OUT = outDir();
const SLUG = slug();
const W = 150;
const H = 56;

const CSS = `
/* Layout: one swimlane chart (browser, backend, database) read top to bottom, then notes in two columns. */
:root {
  --bg: #f4f5f7;
  --fg: #1b2130;
  --muted: #566074;
  --line: #6b7487;
  --card: #ffffff;
  --rule: #d6dae3;
  --zone-fe: #e5ecf7;
  --zone-be: #ebe6f4;
  --zone-db: #f6ebd6;
  --zone-ui: #e6f1ea;
  --new: #0b7a68;
  --new-bg: #dff2ed;
  --no: #b3261e;
  --no-bg: #fbe5e3;
  --sans: "IBM Plex Sans", "Segoe UI", system-ui, sans-serif;
  --mono: "IBM Plex Mono", ui-monospace, Consolas, monospace;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #12151c; --fg: #e7eaf1; --muted: #9aa3b5; --line: #8a93a8; --card: #1b2030; --rule: #2b3244;
    --zone-fe: #182235; --zone-be: #211d32; --zone-db: #2b2418; --zone-ui: #16271f;
    --new: #4fd1b8; --new-bg: #163230; --no: #ff8a80; --no-bg: #381c1c;
    color-scheme: dark;
  }
}
:root[data-theme="dark"] {
  --bg: #12151c; --fg: #e7eaf1; --muted: #9aa3b5; --line: #8a93a8; --card: #1b2030; --rule: #2b3244;
  --zone-fe: #182235; --zone-be: #211d32; --zone-db: #2b2418; --zone-ui: #16271f;
  --new: #4fd1b8; --new-bg: #163230; --no: #ff8a80; --no-bg: #381c1c;
  color-scheme: dark;
}
* { box-sizing: border-box; }
body {
  background: var(--bg);
  color: var(--fg);
  font-family: var(--sans);
  font-size: 15px;
  line-height: 1.55;
  padding-block: 32px 56px;
  padding-left: max(16px, env(safe-area-inset-left, 0px));
  padding-right: max(16px, env(safe-area-inset-right, 0px));
}
.wrap { max-width: 1120px; margin: 0 auto; display: grid; gap: 28px; }
.kicker { font: 500 12px var(--mono); letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin: 0 0 6px; }
h1 { font-size: clamp(26px, 4vw, 36px); line-height: 1.15; margin: 0 0 14px; text-wrap: balance; font-weight: 600; }
h2 { font-size: 17px; margin: 0 0 10px; font-weight: 600; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; padding: 0; list-style: none; }
.chips li { border: 1px solid var(--rule); background: var(--card); border-radius: 6px; padding: 4px 10px; font-size: 13px; }
.chips b { font-weight: 600; }
figure { margin: 0; display: grid; gap: 10px; min-width: 0; }
.scroll { overflow-x: auto; border: 1px solid var(--rule); border-radius: 8px; background: var(--bg); }
svg { display: block; width: 100%; min-width: 900px; height: auto; color: var(--fg); }
figcaption { font-size: 14px; color: var(--muted); max-width: 75ch; }
.legend { display: flex; flex-wrap: wrap; gap: 8px 22px; font-size: 13px; color: var(--muted); margin: 0; padding: 0; list-style: none; }
.legend li { display: flex; align-items: center; gap: 8px; }
.sw { width: 30px; height: 16px; border-radius: 8px; border: 1.5px solid var(--line); background: var(--card); flex: none; }
.sw.new { border: 1.5px dashed var(--new); background: var(--new-bg); }
.sw.no { border: 1.5px dashed var(--no); background: var(--no-bg); }
.cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 440px), 1fr)); gap: 32px; }
.cols > section { min-width: 0; }
ol, ul.plain { margin: 0; padding-left: 22px; display: grid; gap: 8px; }
ul.plain { list-style: disc; }
li::marker { color: var(--muted); }
code { font: 13px var(--mono); background: var(--card); border: 1px solid var(--rule); border-radius: 4px; padding: 1px 5px; overflow-wrap: anywhere; }
.open { border-left: 3px solid var(--new); padding: 2px 0 2px 14px; margin-top: 22px; }
.open h2 { color: var(--new); }

/* chart parts */
.zone-fe { fill: var(--zone-fe); }
.zone-be { fill: var(--zone-be); }
.zone-db { fill: var(--zone-db); }
.zone-ui { fill: var(--zone-ui); }
.zh { font: 500 11px var(--mono); letter-spacing: 0.1em; fill: var(--muted); }
.b { fill: var(--card); stroke: var(--line); stroke-width: 1.5; }
.b-new { fill: var(--new-bg); stroke: var(--new); stroke-width: 1.5; stroke-dasharray: 5 4; }
.b-no { fill: var(--no-bg); stroke: var(--no); stroke-width: 1.5; stroke-dasharray: 5 4; }
.bt { font: 600 13px var(--sans); fill: var(--fg); text-anchor: middle; }
.bs { font: 10.5px var(--mono); fill: var(--muted); text-anchor: middle; }
.ar { stroke: var(--line); stroke-width: 1.5; fill: none; }
.ar-no { stroke: var(--no); stroke-width: 1.5; stroke-dasharray: 5 4; fill: none; }
.mk { fill: var(--line); }
.mk-no { fill: var(--no); }
.al { font: 11.5px var(--sans); fill: var(--fg); }
.al-no { font: 11.5px var(--sans); fill: var(--no); }
.mid { text-anchor: middle; }
.end { text-anchor: end; }
.xmark { stroke: var(--no); stroke-width: 2; fill: var(--bg); }
`;

function bubble(cx, cy, title, sub, kind = "b") {
  const x = cx - W / 2;
  const y = cy - H / 2;
  return (
    `<g><rect class="${kind}" x="${x}" y="${y}" width="${W}" height="${H}" rx="28"/>` +
    `<text class="bt" x="${cx}" y="${cy - 4}">${title}</text>` +
    `<text class="bs" x="${cx}" y="${cy + 13}">${sub}</text></g>`
  );
}
const arrow = (d, cls = "ar") =>
  `<path class="${cls}" d="${d}" marker-end="url(#${cls === "ar" ? "ah" : "ah-no"})"/>`;
const label = (x, y, text, cls = "al") => `<text class="${cls}" x="${x}" y="${y}">${text}</text>`;

const DEFS = `<defs>
<marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="mk" d="M0 0L10 5L0 10z"/></marker>
<marker id="ah-no" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="mk-no" d="M0 0L10 5L0 10z"/></marker>
</defs>`;

function page({ title, kicker, h1, chips, svg, caption, aria, steps, facts, open }) {
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;600&display=swap">
<style>${CSS}</style>
<div class="wrap">
<header>
<p class="kicker">${kicker}</p>
<h1>${h1}</h1>
<ul class="chips">${chips.map((c) => `<li>${c}</li>`).join("")}</ul>
</header>
<figure>
<div class="scroll">${svg.replace("<svg ", `<svg role="img" aria-label="${aria}" `)}</div>
<figcaption>${caption}</figcaption>
<ul class="legend">
<li><span class="sw"></span>Exists today</li>
<li><span class="sw new"></span>New or changed in this story</li>
<li><span class="sw no"></span>Not allowed</li>
</ul>
</figure>
<div class="cols">
<section>
<h2>Steps in the chart</h2>
<ol>${steps.map((s) => `<li>${s}</li>`).join("")}</ol>
</section>
<section>
<h2>Facts from the code</h2>
<ul class="plain">${facts.map((s) => `<li>${s}</li>`).join("")}</ul>
<div class="open">
<h2>Open points</h2>
<ul class="plain">${open.map((s) => `<li>${s}</li>`).join("")}</ul>
</div>
</section>
</div>
</div>
`;
}

/* ---------------------------------------------------------------- this story */
const A = 100,
  B = 290,
  C = 480,
  GX = 740,
  DX = 975;

const svg128 = `<svg viewBox="0 0 1080 840" xmlns="http://www.w3.org/2000/svg">
${DEFS}
<rect class="zone-fe" x="20" y="60" width="620" height="760" rx="10"/>
<rect class="zone-be" x="650" y="60" width="190" height="760" rx="10"/>
<rect class="zone-db" x="850" y="60" width="210" height="760" rx="10"/>
<text class="zh" x="34" y="82">BROWSER (NEXT.JS)</text>
<text class="zh" x="664" y="82">BACKEND (NESTJS)</text>
<text class="zh" x="864" y="82">DATABASE</text>

${arrow(`M${A} 158 L250 222`)}${label(158, 208, "search text", "al end")}
${arrow(`M${B} 158 V222`)}${label(B + 12, 196, "sort field")}
${arrow(`M${C} 158 L330 222`)}${label(424, 208, "page number")}
${arrow(`M${B} 278 V322`)}${label(B + 12, 304, "state becomes variables")}
${arrow(`M340 374 L412 436`)}${label(392, 396, "variables changed")}
${arrow(`M555 450 H665`)}${label(610, 442, "POST /graphql", "al mid")}
${arrow(`M${GX} 478 V522`)}${label(GX + 12, 505, "if ADMIN")}
${arrow(`M815 540 H900`)}${label(857, 532, "Prisma", "al mid")}
${arrow(`M900 560 H815`)}${label(857, 577, "rows + total", "al mid")}
${arrow(`M${GX} 578 V622`)}${label(GX + 12, 605, "items + total")}
${arrow(`M665 650 H555`)}${label(610, 642, "JSON response", "al mid")}
${arrow(`M470 678 L362 748`)}${label(428, 728, "rows, total")}
${arrow(`M215 760 H10 V130 H25`)}${label(24, 752, "admin acts again")}

${arrow(`M405 650 H175`, "ar-no")}
<g><circle class="xmark" cx="290" cy="650" r="10"/><path class="ar-no" d="M285 645 L295 655 M295 645 L285 655" stroke-dasharray="none"/></g>
${label(290, 632, "never filter or sort here", "al-no mid")}

${bubble(A, 130, "Search box", "name or domain", "b-new")}
${bubble(B, 130, "Sort header", "Name, Start, End", "b-new")}
${bubble(C, 130, "Page control", "next, previous", "b-new")}
${bubble(B, 250, "Query state", "search, sort, page", "b-new")}
${bubble(B, 350, "useProjects hook", "variables for query", "b-new")}
${bubble(C, 450, "Apollo Client", "asks the backend")}
${bubble(GX, 450, "Roles guard", "ADMIN only")}
${bubble(GX, 550, "ProjectsService", "where, order, skip")}
${bubble(DX, 550, "PostgreSQL", "findMany + count")}
${bubble(GX, 650, "ProjectPage", "{ items, total }")}
${bubble(C, 650, "Apollo cache", "stores the result")}
${bubble(B, 760, "Table + pager", "backend order", "b-new")}
${bubble(A, 650, "Browser filter", "or sort: not allowed", "b-no")}
</svg>`;

const p128 = page({
  title: "Projects Search Data Flow",
  kicker: "Data flow",
  h1: "Projects search, sort and pagination",
  chips: [
    "<b>Depends on</b> KAN-127 (S5.5b-1)",
    "<b>Acceptance criteria</b> 6 to 12",
    "<b>Docs</b> <code>docs/pages/27-projects-page.md</code>",
  ],
  svg: svg128,
  aria: "Data flow of Projects search, sort and pagination: the admin searches, sorts or changes page, the query state becomes new variables, Apollo asks the backend, the backend filters, sorts and cuts the page in PostgreSQL, and the table shows the rows in the order the backend returned. Filtering or sorting in the browser is not allowed.",
  caption:
    "Every search, sort or page change sends new variables to the backend. The backend does the work and the table shows the rows as they arrive. The red path is the rule from the story: the browser never filters or sorts the rows it already has.",
  steps: [
    "The admin types in the search box, clicks a sort header (Name, Start Date or End Date), or uses the page control.",
    "The query state keeps three values: the search text, the sort field with its direction, and the page number.",
    "A changed value changes the variables of <code>useProjects</code>. Apollo Client sees new variables and asks the backend again.",
    "The Roles guard lets only the ADMIN role through.",
    "<code>ProjectsService</code> builds the database query from the three values. Search matches name or domain, not case sensitive. The backend sorts first, then cuts the page.",
    "PostgreSQL returns the rows for this page and the total count that matches the search.",
    "The backend returns <code>ProjectPage</code> with <code>items</code> and <code>total</code>.",
    "Apollo Client stores the answer. The table shows the rows in the order the backend gave. The page control uses <code>total</code> to find how many pages exist.",
    "The browser never calls <code>.filter()</code> or <code>.sort()</code> on the loaded rows. Search and sort work together because both values go in the same query.",
  ],
  facts: [
    "The backend already does all of this. No <code>schema.gql</code> change is needed, so this story is frontend only.",
    "Allowed <code>sort.field</code> values: <code>name</code>, <code>startDate</code>, <code>endDate</code>. Any other value gives a validation error. The direction is <code>ASC</code> or <code>DESC</code>. With no sort, the backend uses name ascending.",
    "Search is trimmed, 100 characters at most, not case sensitive, and checks name and domain. An empty search returns all projects.",
    "Page: <code>number</code> starts at 1, <code>size</code> is 1 to 100. The backend default is number 1 and size 20. The frontend uses size 10.",
    "The shared <code>SearchField</code>, <code>DataTable</code> (sort header with an arrow and <code>aria-sort</code>) and <code>Pagination</code> already exist. This story connects them to the query state. It does not build them.",
    "The backend adds <code>id</code> as a second sort key, so one project cannot show on two pages.",
    "Source: <code>backend/src/modules/projects/projects.service.ts</code> and <code>backend/src/common/pagination/</code>.",
  ],
  open: [
    "<code>DataTable</code> cycles a sort click as none, then ASC, then DESC, then none. The story names only ASC and DESC. With no sort, the backend uses Name A to Z, but the table shows no arrow. Decide if this is fine, or if the cycle should skip none.",
    "<code>SearchField</code> already waits 300 ms after typing stops (the code says this value is a guess, not from the docs). Confirm 300 ms with the team.",
    "The page must go back to page 1 when search or sort changes. The Pagination and DataTable READMEs say this is the page's job, not the component's. The page must also fix a page number that is past the last page, for example after a search with fewer results.",
    "The list query must send <code>page: { number, size: DEFAULT_PAGE_SIZE }</code> (10). The backend default is 20, which would break the page numbers. <code>useProjects</code> already sends it for page 1, and the query now has no default page, so every caller must send one.",
    "The hook and the table from KAN-127 exist on the projects-list branch, but they are not merged, and the page <code>/admin/projects</code> still shows only a heading. Step 1 of the plan builds the page.",
    "The test data has 6 projects, so the page buttons do not show with size 10 until there are 11 or more.",
  ],
});

writeFileSync(`${OUT}/${SLUG}-data-flow.html`, p128);
console.log("written", p128.length);

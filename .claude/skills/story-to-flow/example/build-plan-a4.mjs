// Builds <output folder>/<slug>-plan-a4.print.html (standalone, with doctype).
// Source of truth for plan text and steps: build-plan.mjs (read as text, not run). Chart and base CSS: <output folder>/<slug>-data-flow.html.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { gloss, termMap, chartBubbles, chartLabels } from "./glossary.mjs";
import { outDir, slug } from "./env.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = outDir();
const SLUG = slug();

/* ---------- reuse plan text and steps from build-plan.mjs ---------- */
const planSrc = readFileSync(`${HERE}/build-plan.mjs`, "utf8");
const dataSrc =
  planSrc.slice(planSrc.indexOf("const esc ="), planSrc.indexOf("const stepHtml")) +
  planSrc.slice(planSrc.indexOf("const acRows"), planSrc.indexOf("const html ="));
const { child, nonProg, intern, steps, acRows, open, esc, pre, code } = new Function(
  `${dataSrc}; return { child, nonProg, intern, steps, acRows, open, esc, pre, code };`,
)();

/* ---------- base css and chart ---------- */
const base = readFileSync(`${OUT}/${SLUG}-data-flow.html`, "utf8");
const baseCss = base
  .match(/<style>([\s\S]*?)<\/style>/)[1]
  .replace("--rule: #d6dae3;", "--rule: #d6dae3; --code-bg: #eceef3; --sheet: #ffffff;")
  .replaceAll("--rule: #2b3244;", "--rule: #2b3244; --code-bg: #0d1017; --sheet: #181c28;");
const extraSrc = planSrc.match(/const EXTRA_CSS = `([\s\S]*?)`;/)[1];

let chart = base
  .match(/<div class="scroll">[\s\S]*?<\/div>(?=\n<figcaption>)/)[0]
  .replace('viewBox="0 0 1080 840"', 'viewBox="0 48 1080 782"');
for (const [title, key] of Object.entries(chartBubbles)) {
  const re = new RegExp(
    `<g>(<rect class="b[^"]*"[^>]*/><text class="bt"[^>]*>${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</text>)`,
  );
  if (!re.test(chart)) throw new Error(`chart bubble not found: ${title}`);
  chart = chart.replace(re, `<g class="hot" tabindex="0" data-t="${key}">$1`);
}
for (const [label, key] of Object.entries(chartLabels)) {
  const re = new RegExp(
    `<text class="al( [a-z]+)?"( x="[^"]*" y="[^"]*")>${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</text>`,
    "g",
  );
  if (!re.test(chart)) throw new Error(`chart label not found: ${label}`);
  chart = chart.replace(
    re,
    (_m, cls, pos) =>
      `<text class="al hot${cls ?? ""}"${pos} tabindex="0" data-t="${key}">${label}</text>`,
  );
}

/* ---------- auto hover words in text nodes ---------- */
const termRe = new RegExp(
  `\\b(${termMap.map(([t]) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?![A-Za-z])`,
  "g",
);
const termKey = Object.fromEntries(termMap);
function linkTerms(html) {
  const seen = new Set();
  const skip = { pre: 0, svg: 0, h1: 0, a: 0, script: 0, style: 0, button: 0 };
  return html
    .split(/(<[^>]+>)/)
    .map((part) => {
      if (part.startsWith("<")) {
        const m = part.match(/^<(\/?)([a-z0-9]+)/i);
        if (m && m[2].toLowerCase() in skip) skip[m[2].toLowerCase()] += m[1] ? -1 : 1;
        return part;
      }
      if (Object.values(skip).some((n) => n > 0)) return part;
      return part.replace(termRe, (w) => {
        const key = termKey[w];
        if (seen.has(key)) return w;
        seen.add(key);
        return `<span class="term" tabindex="0" data-t="${key}">${w}</span>`;
      });
    })
    .join("");
}

/* ---------- look: black and white tokens and rules, used for the toggle and for print ---------- */
const bwTokens = `--bg:#ffffff;--fg:#000000;--muted:#333333;--line:#000000;--card:#ffffff;--rule:#9a9a9a;--sheet:#ffffff;--code-bg:#f2f2f2;
--zone-fe:#f1f1f1;--zone-be:#e3e3e3;--zone-db:#d2d2d2;--zone-ui:#ffffff;--new:#000000;--new-bg:#e9e9e9;--no:#000000;--no-bg:#ffffff;color-scheme:light;`;
const bwRules = (p) => `
${p} h2 { border-bottom: 2.5px solid #000; padding-bottom: 3px; }
${p} .kicker { font-weight: 500; }
${p} th { border-bottom: 2.5px solid #000; color: #000; }
${p} td { border-bottom: 0.75px solid #777; }
${p} .b { stroke-width: 1; }
${p} .b-new { stroke-dasharray: none; stroke-width: 3.2; }
${p} .b-no { stroke-dasharray: 2 3; stroke-width: 1.5; }
${p} .ar { stroke-width: 1.2; }
${p} .ar-no { stroke-width: 1.8; }
${p} .al-no { font-style: italic; font-weight: 600; }
${p} .sw { border-width: 1px; }
${p} .sw.new { border: 3px solid #000; background: #e9e9e9; }
${p} .sw.no { border: 1.5px dotted #000; background: #fff; }
${p} .open { border-left-width: 5px; }
${p} .term { border-bottom: 1.5px dotted #000; }
${p} .term:hover, ${p} .term:focus-visible { background: #000; color: #fff; }
${p} .sheet { box-shadow: none; border: 1px solid #000; }
${p} .step .no { color: #000; font-weight: 700; }
${p} .group > h3, ${p} .open h2 { color: #000; }
${p} pre { border: 1px solid #000; }
${p} .qa .q { border-left: 5px solid #000; }
${p} .verdict.yes { font-weight: 700; }
`;

const css = `${baseCss}${extraSrc}
/* ---- A4 sheets ---- */
body { padding-block: 16px 40px; }
.tool { max-width: 297mm; margin: 0 auto 16px; display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: center; justify-content: space-between; font-size: 13px; color: var(--muted); }
.look { display: inline-flex; border: 1.5px solid var(--line); border-radius: 999px; overflow: hidden; }
.look button { font: 500 12px var(--mono); background: var(--card); color: var(--fg); border: 0; padding: 6px 14px; cursor: pointer; }
.look button[aria-pressed="true"] { background: var(--fg); color: var(--bg); }
.look button:focus-visible { outline: 2px solid var(--new); outline-offset: -2px; }
.sheet { background: var(--sheet); border: 1px solid var(--rule); border-radius: 4px; box-shadow: 0 2px 14px rgba(0,0,0,.08);
  width: 210mm; max-width: 100%; min-height: 297mm; margin: 0 auto 22px; padding: 12mm 8mm; display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.sheet.land { width: 297mm; min-height: 210mm; }
.sheet > * { min-width: 0; }
.sheet pre { white-space: pre-wrap; overflow-wrap: anywhere; overflow-x: visible; padding: 10px 12px; }
.sheet pre code { white-space: inherit; overflow-wrap: inherit; }
.sf { margin-top: auto; display: flex; justify-content: space-between; font: 500 11px var(--mono); color: var(--muted); border-top: 1px solid var(--rule); padding-top: 6px; }
.st { margin: 0; }
.sheet h1 { margin: 0 0 12px; }
.sheet h2 { font-size: 20px; }
.lead { font-size: 15px; max-width: 70ch; margin: 0; }
.toc { display: grid; gap: 0; margin: 0; padding: 0; list-style: none; }
.toc li { display: flex; gap: 10px; align-items: baseline; padding: 6px 0; border-bottom: 1px solid var(--rule); }
.toc a { color: var(--fg); text-decoration: none; font-weight: 600; }
.toc span.d { color: var(--muted); font-size: 13px; flex: 1; }
.toc b { font: 600 13px var(--mono); }
.howto { border: 1.5px solid var(--line); border-radius: 8px; padding: 12px 16px; display: grid; gap: 6px; }
.howto h3 { margin: 0; font: 500 12px var(--mono); letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
.howto ul { margin: 0; padding-left: 18px; display: grid; gap: 3px; }
.term, .hot { cursor: help; }
.term { border-bottom: 1.5px dotted var(--new); }
.term:hover, .term:focus-visible { background: var(--new-bg); outline: none; }
.hot:hover .b, .hot:hover .b-new, .hot:hover .b-no, .hot:focus-visible .b, .hot:focus-visible .b-new, .hot:focus-visible .b-no { stroke: var(--fg); stroke-width: 3; }
.hot.al:hover, .hot.al:focus-visible { text-decoration: underline; outline: none; }
.hot:focus { outline: none; }
#tip { position: fixed; z-index: 50; width: min(400px, calc(100vw - 24px)); max-height: 70vh; overflow: auto; background: var(--card); color: var(--fg);
  border: 1.5px solid var(--fg); border-radius: 8px; padding: 12px 14px; box-shadow: 0 8px 30px rgba(0,0,0,.28); font-size: 13px; line-height: 1.5; display: none; }
#tip.on { display: block; }
#tip h4 { margin: 0; font-size: 15px; }
#tip .k { font: 500 11px var(--mono); letter-spacing: .08em; text-transform: uppercase; color: var(--muted); margin: 0 0 6px; }
#tip p { margin: 0 0 8px; }
#tip ul { margin: 0 0 8px; padding-left: 16px; }
#tip li { overflow-wrap: anywhere; font: 12px var(--mono); }
#tip pre { margin: 4px 0 0; font-size: 11.5px; white-space: pre-wrap; overflow-wrap: anywhere; }
.sketch { display: grid; gap: 8px; }
.sketch .row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.sketch .lab { flex: 0 0 100%; font: 500 12px var(--mono); color: var(--muted); }
.chip { border: 1px solid var(--line); border-radius: 999px; padding: 1px 10px; font: 13px var(--mono); background: var(--card); }
.chip.bad { border-style: dashed; border-color: var(--no); color: var(--no); background: var(--no-bg); }
.chip.good { border-width: 2px; border-color: var(--new); background: var(--new-bg); font-weight: 600; }
.box { border: 1px solid var(--rule); border-radius: 8px; padding: 12px 14px; background: var(--card); display: grid; gap: 8px; }
.box h3 { margin: 0; font-size: 15px; }
.box p, .box ul { margin: 0; }
.box ul { padding-left: 18px; display: grid; gap: 4px; }
.qa { display: grid; gap: 12px; }
.qa .q { border-left: 4px solid var(--new); padding: 2px 0 2px 12px; font-size: 17px; font-weight: 600; margin: 0; text-wrap: balance; }
.qa .short { font-size: 15px; margin: 0; }
.alt td, .alt th { font-size: 12.5px; padding: 6px 8px; }
.alt td:first-child { font-weight: 600; width: 16%; }
.verdict { font-weight: 600; }
.verdict.no { color: var(--fg); font-weight: 400; }
.verdict.yes { color: var(--new); }
.note { font-size: 12.5px; color: var(--muted); margin: 0; }
.gl td, .gl th { font-size: 11.5px; padding: 4px 8px; }
.gl td:first-child { font-weight: 600; white-space: nowrap; }
.gl td:nth-child(3) { font: 11px var(--mono); overflow-wrap: anywhere; }
.sheet .step { padding: 12px 0; }
.sheet .plans { grid-template-columns: 1fr; }
.sheet .plan { padding: 12px 16px; gap: 6px; }
.stack svg { min-width: 0; }
.stack .scroll, .flow .scroll { border: 0; background: transparent; }

@media (max-width: 880px) {
  .sheet, .sheet.land { width: auto; min-height: 0; padding: 18px 16px; }
  .sheet .scroll svg { min-width: 760px; }
}

html:root[data-look="bw"] { ${bwTokens} }
${bwRules('html:root[data-look="bw"]')}

/* ---- print: always black and white, A4 ---- */
@page { size: A4 portrait; margin: 12mm 9mm; }
@page land { size: A4 landscape; margin: 10mm 9mm; }
@media print {
  html:root { ${bwTokens} }
  ${bwRules("html:root")}
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { padding: 0; font-size: 9.6pt; line-height: 1.42; }
  .tool, #tip { display: none !important; }
  .sheet { width: auto; max-width: none; min-height: 266mm; margin: 0; padding: 0; border: 0 !important; border-radius: 0; box-shadow: none; break-after: page; gap: 10px; }
  .sheet:last-of-type { break-after: auto; }
  .sheet.land { page: land; min-height: 176mm; }
  .sheet h1 { font-size: 24pt; }
  .sheet h2 { font-size: 15pt; }
  .step { break-inside: avoid; }
  pre { font-size: 8.3pt; line-height: 1.38; padding: 7px 9px; white-space: pre-wrap; overflow-wrap: anywhere; }
  .scroll { overflow: visible !important; }
  .flow svg { min-width: 0; width: auto; max-width: 100%; height: 140mm; margin: 0 auto; }
  .flow .al { font-size: 12.5px; }
  .stack svg { width: 100%; height: auto; max-height: 205mm; }
  .gl td, .gl th { font-size: 8pt; padding: 2px 5px; }
  .gl td:nth-child(3) { font-size: 6.6pt; }
  .alt td, .alt th { font-size: 8.4pt; padding: 4px 5px; }
  .plan, .box, .howto { break-inside: avoid; }
  .term { border-bottom: 1px dotted #000; }
}
`;

/* ---------- stack diagram (architecture slice) ---------- */
const stackBox = (y, title, sub, cls, key, note) =>
  `<g class="hot" tabindex="0" data-t="${key}"><rect class="${cls}" x="20" y="${y}" width="340" height="50" rx="25"/><text class="bt" x="190" y="${y + 22}">${title}</text><text class="bs" x="190" y="${y + 38}">${sub}</text></g>` +
  `<text class="al" x="385" y="${y + 29}">${note}</text>`;
const stackArrow = (x, y1, y2, label) =>
  `<path class="ar" d="M${x} ${y1} V${y2}" marker-end="url(#sh)"/><text class="al" x="${x + 12}" y="${(y1 + y2) / 2 + 4}">${label}</text>`;
const stack = `<div class="scroll"><svg role="img" aria-label="The slice of the architecture that this story touches, from the Projects page in the browser, through Apollo Client and the network, to the resolver, the service, Prisma and PostgreSQL. The new parts are the page itself, the query state hook and its pure helpers." viewBox="0 0 700 676" xmlns="http://www.w3.org/2000/svg">
<defs><marker id="sh" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="mk" d="M0 0L10 5L0 10z"/></marker></defs>
<rect class="zone-fe" x="0" y="0" width="700" height="402" rx="10"/><text class="zh" x="14" y="20">BROWSER (NEXT.JS)</text>
<rect class="zone-be" x="0" y="424" width="700" height="250" rx="10"/><text class="zh" x="686" y="444" text-anchor="end">BACKEND (NESTJS) AND DATABASE</text>
${stackBox(34, "Projects page", "features/projects/Projects.tsx", "b-new", "projectspage", "New in step 1. Wires the hooks.")}
${stackArrow(190, 84, 110, "setSearch, setSort, setPage")}
${stackBox(110, "Query state hook", "useProjectsQueryState/", "b-new", "querystate", "Owns search, sort and page.")}
${stackArrow(190, 160, 186, "state in, new state out")}
${stackBox(186, "Pure helpers", "utils/projects-query.utils.ts", "b-new", "pure", "No React. Easy to test.")}
${stackArrow(190, 236, 262, "variables")}
${stackBox(262, "useProjects hook", "features/projects/useProjects/", "b", "hook", "Exists. Step 6 adds variables.")}
${stackArrow(190, 312, 338, "variables")}
${stackBox(338, "Apollo Client", "frontend/src/shared/apollo", "b", "apollo", "Sends, caches, repeats.")}
${stackArrow(190, 388, 454, "")}
<text class="al" x="202" y="416" data-t="post">POST /graphql (network)</text>
${stackBox(454, "ProjectsResolver", "projects.resolver.ts", "b", "guard", "Thin. ADMIN role only.")}
${stackArrow(190, 504, 530, "ListArgs")}
${stackBox(530, "ProjectsService.list", "projects.service.ts", "b", "service", "Builds where, orderBy, skip.")}
${stackArrow(190, 580, 606, "where, orderBy, skip, take")}
${stackBox(606, "Prisma and PostgreSQL", "PrismaService, findMany + count", "b", "prisma", "Runs the query on all rows.")}
</svg></div>`;

/* ---------- sheets ---------- */
const sheets = []; // { id, title, desc, land, html }
const sheet = (id, title, desc, html, land = false) => sheets.push({ id, title, desc, html, land });

sheet("cover", "Contents and how to read", "", "__COVER__");
sheet(
  "plans",
  "Three plans",
  "For a child, a non-programmer and a web dev intern.",
  `
<h2 class="st">Three plans, one for each reader</h2>
<div class="plans">
<article class="plan"><h3>For a child</h3>${child}</article>
<article class="plan"><h3>For a non-programmer</h3>${nonProg}</article>
<article class="plan"><h3>For a web dev intern</h3>${intern}</article>
</div>`,
);
sheet(
  "flow",
  "Flow chart",
  "One search, sort or page change, from the admin to the database and back.",
  `
<h2 class="st">Flow chart: what happens on one click</h2>
<figure class="flow">
${chart}
<figcaption>Every search, sort or page change sends new variables to the backend. The backend does the work and the table shows the rows as they arrive. The crossed path is the story rule: the browser never filters or sorts the rows it already has. Hover or tap a bubble or a label to read what it is.</figcaption>
<ul class="legend">
<li><span class="sw"></span>Exists today</li>
<li><span class="sw new"></span>New in this story</li>
<li><span class="sw no"></span>Not allowed</li>
</ul>
</figure>`,
  true,
);
sheet(
  "slice",
  "The architecture slice",
  "The layers that this story touches, with the file of each layer.",
  `
<h2 class="st">The architecture slice you work in</h2>
<p class="lead">This story touches one vertical line through the project. Three boxes are new: the Projects page (step 1, the end of KAN-127), the query state hook and its pure helpers (steps 2 to 4). The table and the useProjects hook exist, and steps 6 to 8 change them. The rest exists. Each box shows where its code lives.</p>
<figure class="stack">${stack}
<figcaption>Read from top to bottom: what the admin does goes down as variables. What the backend returns comes back up as rows and a total. Dashed bubbles are new. Hover or tap a box for the code.</figcaption>
<ul class="legend"><li><span class="sw"></span>Exists</li><li><span class="sw new"></span>New in this plan</li></ul>
</figure>`,
);

sheet(
  "why",
  "Why the backend does the work",
  "Why the browser does not filter or sort, with a worked example.",
  `
<h2 class="st">Why the backend does the work</h2>
<div class="qa">
<p class="q">If the browser does not sort and filter, why is that the design?</p>
<p class="short"><b>Short answer:</b> the browser never holds the whole list. It holds one page, 10 rows. Sorting or filtering 10 rows gives a wrong answer for the whole list.</p>
</div>
<div class="box">
<h3>Worked example (example names, not from the database)</h3>
<p>The database holds 25 projects. The page size is 10. The admin clicks <b>Name, A to Z</b>.</p>
<div class="sketch">
<div class="row"><span class="lab">A. The browser sorts what it holds (page 1 in stored order). The admin sees the wrong first row.</span>
<span class="chip">Bravo</span><span class="chip">Delta</span><span class="chip">Echo</span><span class="chip">Hotel</span><span class="chip">Kilo</span><span class="chip">Lima</span><span class="chip">Mike</span><span class="chip">Oscar</span><span class="chip">Tango</span><span class="chip">Zulu</span></div>
<div class="row"><span class="lab">The real first project is on page 3, so it is missing:</span><span class="chip bad">Alpha (page 3)</span></div>
<div class="row"><span class="lab">B. The database sorts all 25 rows, then cuts page 1. The admin sees the right rows.</span>
<span class="chip good">Alpha</span><span class="chip good">Bravo</span><span class="chip good">Charlie</span><span class="chip good">Delta</span><span class="chip good">Echo</span><span class="chip good">Foxtrot</span><span class="chip good">Golf</span><span class="chip good">Hotel</span><span class="chip good">India</span><span class="chip good">Juliet</span></div>
</div>
<p>Search fails in the same way. The admin types <code>zu</code>. Page 1 holds <b>Zulu</b>, page 3 holds <b>Zuma</b>. The browser finds one match. The database finds both.</p>
</div>
<div class="box">
<h3>Five reasons, each tied to this project</h3>
<ul>
<li><b>It is correct.</b> The database sees every row. The browser sees one page. (The example above.)</li>
<li><b>It is small.</b> Only one page leaves the server. Example numbers, not measured: 5,000 projects at about 1 KB each is about 5 MB for a full download, and about 10 KB for one page.</li>
<li><b>One rule, one place.</b> The backend matches name and domain without case, accepts only the sort fields <code>name</code>, <code>startDate</code> and <code>endDate</code>, and adds <code>id</code> as a second sort key so no project shows on two pages (verified: <code>projects.service.ts</code>). A copy of these rules in the browser could disagree with them.</li>
<li><b>Security stays on the backend.</b> The ADMIN check runs before the query (AGENTS.md: authorization on the backend). The browser never receives rows it did not ask for.</li>
<li><b>The story requires it.</b> AC-8: search runs on the backend. AC-12: sorting runs on the backend. So the team does not choose here. This page explains the reason.</li>
</ul>
</div>
<div class="box">
<h3>What we pay for this choice</h3>
<ul>
<li>One request for each change of search, sort or page. The 300 ms wait in <code>SearchField</code> keeps typing from sending one request per key.</li>
<li>The table can show its Loading state between requests (see Open points).</li>
<li>The backend runs a second query, <code>count</code>, to know <code>total</code> for the page buttons (verified: both run in one transaction).</li>
</ul>
</div>`,
);

const altRows = [
  [
    "The browser does everything",
    "Download all rows. Filter and sort them in JavaScript.",
    "Typing feels instant. No request after the first.",
    "Every page open downloads every row. The data goes stale. The rules exist twice. The cost grows with every new project.",
    "no",
    "Rejected (AC-8, AC-12)",
  ],
  [
    "The browser sorts the first 100 rows",
    "Download a fixed number. Filter and sort those.",
    "Smaller download than option 1.",
    "Wrong without any error when there are more than 100 projects. The admin cannot see that rows are missing.",
    "no",
    "Rejected",
  ],
  [
    "The backend loads all rows into memory, then sorts",
    "Node reads every row, then filters and sorts in JavaScript.",
    "Simple code for small tables.",
    "All rows travel from the database to Node on every request. The database already has a faster engine for this work.",
    "no",
    "Rejected",
  ],
  [
    "The database does the work (chosen)",
    "Prisma sends where, orderBy, skip and take. PostgreSQL returns one page.",
    "Correct for all rows. Only one page moves. One rule in one place.",
    "One request per change. A second query for total.",
    "yes",
    "Chosen (exists today)",
  ],
  [
    "A search engine (for example Elasticsearch or Meilisearch)",
    "A separate service keeps its own copy of the data and answers searches.",
    "Ranking, typo tolerance, fast on millions of rows.",
    "A new service to run. A second copy of the data to keep in sync. Search on two columns does not need it.",
    "no",
    "Later, if search outgrows the database",
  ],
  [
    "Cursor pagination or infinite scroll",
    "Ask for rows after the last row you saw. No page numbers.",
    "Stable when rows change often. Fast on very deep pages.",
    "No jump to page 3 of 8. The shared Pagination component and the page spec use page numbers.",
    "no",
    "Not needed now",
  ],
  [
    "Keep search, sort and page in the URL",
    "For example <code>?q=ada&amp;sort=name&amp;page=2</code> in the address bar.",
    "The admin can share or bookmark a view. The Back button works.",
    "More code: read, check and write the address. The plan keeps the three values in the page state.",
    "no",
    "Possible follow-up. Ask the team",
  ],
];
sheet(
  "alt",
  "Alternatives",
  "What else we could do, and why each option is worse in this project.",
  `
<h2 class="st">Alternatives, and why they are worse here</h2>
<p class="lead">Each row is a real option. The last column is a verdict for this project. It is not a verdict for every project.</p>
<div class="tw"><table class="alt">
<thead><tr><th>Option</th><th>How it works</th><th>Better at</th><th>Worse here because</th><th>Verdict</th></tr></thead>
<tbody>${altRows.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td class="verdict ${r[4]}">${r[5]}</td></tr>`).join("")}</tbody>
</table></div>
<div class="box">
<h3>When would the browser option be right?</h3>
<p>When the list is small, never grows, and always fits on one page. A drop-down with 8 environments is an example. The Projects list is a catalogue that grows with the company, and the page spec asks for pages. So the database does the work.</p>
</div>
<p class="note">Reasoning, not a measurement. The option table uses general knowledge about the tools. Only the statements marked verified were read in the repo.</p>`,
);

/* ---------- steps ---------- */
const stepItem = (s) => `<div class="step"><div class="no">${s.n}</div><div>
<h4>${s.title}</h4>
${s.files.length ? `<ul class="files">${s.files.map((f) => `<li>${code(f)}</li>`).join("")}</ul>` : ""}
<p>${s.what}</p>
${s.code ? pre(s.code) : ""}${s.test ? pre(s.test) : ""}
<p class="done">${s.done}</p></div></div>`;
const byN = (n) => stepItem(steps.find((s) => s.n === n));
const groupTitles = steps.filter((s) => s.group).map((s) => s.group);
const stepSheet = (id, title, desc, body) =>
  sheet(id, title, desc, `<h2 class="st">${title}</h2>${body}`);
stepSheet(
  "steps1",
  "Step 1: the page",
  "The table on the real page.",
  `<p class="note">The pseudo code shows the idea. It is not final code. Write the real code, run the checks, and ask Claude for a commit message after each step.</p><div class="group"><h3>${groupTitles[0]}</h3>${byN(1)}</div>`,
);
stepSheet(
  "steps2",
  "Step 2: the type",
  "The state type.",
  `<div class="group"><h3>${groupTitles[1]}</h3>${byN(2)}</div>`,
);
stepSheet(
  "steps3",
  "Step 3: pure functions",
  "The pure functions and their test.",
  `<div class="group">${byN(3)}</div>`,
);
stepSheet(
  "steps4",
  "Steps 4 and 5: the hook",
  "The state hook and the checks.",
  `<div class="group">${[4, 5].map(byN).join("")}</div>`,
);
stepSheet(
  "steps5",
  "Step 6: useProjects",
  "useProjects takes the variables.",
  `<div class="group"><h3>${groupTitles[2]}</h3>${byN(6)}</div>`,
);
stepSheet(
  "steps6",
  "Step 7: sortable columns",
  "Three columns get a sort.",
  `<div class="group">${byN(7)}</div>`,
);
stepSheet(
  "steps7",
  "Step 8: the wiring",
  "The page wiring and the texts.",
  `<div class="group">${byN(8)}</div>`,
);
stepSheet(
  "steps8",
  "Step 9: the page tests",
  "The tests of the page.",
  `<div class="group">${byN(9)}</div>`,
);
stepSheet(
  "steps9",
  "Steps 10 to 12: finish",
  "The story, the hand check and the notes.",
  `<div class="group">${[10, 11, 12].map(byN).join("")}</div>`,
);

sheet(
  "ac",
  "Criteria and open points",
  "Which step covers which acceptance criterion, and what is not yet known.",
  `
<h2 class="st">Criteria check</h2>
<div class="tw"><table>
<thead><tr><th>Criterion</th><th>What it says</th><th>Steps</th><th>Note</th></tr></thead>
<tbody>${acRows.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join("")}</tbody>
</table></div>
<section class="open"><h2>Open points</h2><ul class="plain">${open.map((o) => `<li>${o}</li>`).join("")}</ul></section>`,
);

const glRows = Object.values(gloss)
  .map(
    (g) =>
      `<tr><td>${esc(g.name)}</td><td>${esc(g.kind)}</td><td>${g.where.map((w) => esc(w)).join("<br>")}</td><td>${esc(g.what)}</td></tr>`,
  )
  .join("");
sheet(
  "gloss",
  "Glossary",
  "Every hover box, written out for the printed copy.",
  `
<h2 class="st">Glossary: every dotted word and bubble</h2>
<p class="lead">On screen, hover or tap a dotted word, a bubble or a label to see this text with code. The code is only on screen.</p>
<div class="tw"><table class="gl"><thead><tr><th>Name</th><th>Kind</th><th>Where</th><th>What it is</th></tr></thead><tbody>${glRows}</tbody></table></div>`,
);

/* ---------- cover ---------- */
const pageOf = (id) => sheets.findIndex((s) => s.id === id) + 1;
const cover = `
<p class="kicker">Plan · A4 · three readers, one flow, one explainer, twelve steps</p>
<h1>Projects search, sort and pagination</h1>
<ul class="chips">
<li><b>Depends on</b> KAN-127 (code on the projects-list branch, not merged)</li>
<li><b>Acceptance criteria</b> 6 to 12</li>
<li><b>Branch</b> <code>feature/projects-search-sort-pagination</code></li>
</ul>
<p class="lead">This story adds search, sort and page buttons to the Projects list. The backend already does the work. The frontend sends three values and shows the rows in the order it receives them. <b>One thing blocks the work:</b> the real Projects page still shows only a heading, so step 1 puts the table on it first.</p>
<ol class="toc">${sheets
  .filter((s) => s.id !== "cover")
  .map(
    (s) =>
      `<li><b>${pageOf(s.id)}</b><a href="#${s.id}">${s.title}</a><span class="d">${s.desc}</span></li>`,
  )
  .join("")}</ol>
<div class="howto"><h3>How to use this page</h3><ul>
<li><b>Hover or tap</b> a dotted word, a bubble or an arrow label. A box opens with what the tool is, the files and functions, and code. Press Esc to close it.</li>
<li><b>Two looks.</b> Use the switch above the page: <i>Colour</i> follows your system theme. <i>Black and white</i> uses black, grey, thick and thin lines.</li>
<li><b>Print.</b> Print always uses the black and white look on A4. The flow chart page prints in landscape. Open the saved file <code>${SLUG}-plan-a4.print.html</code> in your browser, press Ctrl+P, choose A4, scale 100 %, and keep Background graphics on.</li>
</ul></div>`;
sheets[0].html = cover;

/* ---------- assemble ---------- */
const sheetHtml = sheets
  .map(
    (s, i) =>
      `<section class="sheet${s.land ? " land" : ""}" id="${s.id}">${s.id === "cover" ? s.html : linkTerms(s.html)}<footer class="sf"><span>${SLUG} plan · ${s.title}</span><span>Page ${i + 1}</span></footer></section>`,
  )
  .join("\n");

const glossJson = JSON.stringify(gloss).replaceAll("<", "\\u003c");
const script = `
(function () {
  var G = ${glossJson};
  var root = document.documentElement;
  function setLook(l) {
    root.setAttribute("data-look", l);
    document.querySelectorAll(".look button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.look === l)); });
    try { localStorage.setItem("kan128-look", l); } catch (e) {}
  }
  var saved = "color";
  try { saved = localStorage.getItem("kan128-look") || "color"; } catch (e) {}
  setLook(saved === "bw" ? "bw" : "color");
  document.querySelectorAll(".look button").forEach(function (b) { b.addEventListener("click", function () { setLook(b.dataset.look); }); });

  var tip = document.getElementById("tip"), cur = null, timer = null;
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; }
  function show(target) {
    var g = G[target.getAttribute("data-t")]; if (!g) return;
    clearTimeout(timer); cur = target;
    tip.textContent = "";
    tip.appendChild(el("h4", "", g.name));
    tip.appendChild(el("p", "k", g.kind));
    tip.appendChild(el("p", "", g.what));
    if (g.where && g.where.length) { var ul = el("ul"); g.where.forEach(function (w) { ul.appendChild(el("li", "", w)); }); tip.appendChild(ul); }
    if (g.code) { var pre = el("pre"); pre.appendChild(el("code", "", g.code)); tip.appendChild(pre); }
    tip.classList.add("on");
    var r = target.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
    var x = Math.max(12, Math.min(r.left, window.innerWidth - w - 12));
    var y = r.bottom + 8; if (y + h > window.innerHeight - 8) y = Math.max(8, r.top - h - 8);
    tip.style.left = x + "px"; tip.style.top = y + "px";
  }
  function hide() { tip.classList.remove("on"); cur = null; }
  function later() { clearTimeout(timer); timer = setTimeout(hide, 220); }
  document.addEventListener("mouseover", function (e) { var t = e.target.closest ? e.target.closest("[data-t]") : null; if (t) show(t); else if (e.target.closest && e.target.closest("#tip")) clearTimeout(timer); });
  document.addEventListener("mouseout", function (e) { if (e.target.closest && (e.target.closest("[data-t]") || e.target.closest("#tip"))) later(); });
  document.addEventListener("focusin", function (e) { var t = e.target.closest ? e.target.closest("[data-t]") : null; if (t) show(t); });
  document.addEventListener("focusout", later);
  document.addEventListener("click", function (e) { var t = e.target.closest ? e.target.closest("[data-t]") : null; if (t) { if (cur === t && tip.classList.contains("on") && e.detail === 0) hide(); else show(t); } else if (!e.target.closest("#tip")) hide(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") hide(); });
  window.addEventListener("scroll", hide, { passive: true });
})();
`;

const head = `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Projects Search Plan A4</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;600&display=swap">
<style>${css}</style>`;
const body = `<div class="tool"><span>Hover or tap dotted words, bubbles and labels for an explanation.</span>
<div class="look" role="group" aria-label="Look"><button type="button" data-look="color" aria-pressed="true">Colour</button><button type="button" data-look="bw" aria-pressed="false">Black and white</button></div></div>
${sheetHtml}
<div id="tip" role="tooltip"></div>
<script>${script}</script>
`;

writeFileSync(
  `${OUT}/${SLUG}-plan-a4.print.html`,
  `<!doctype html>\n<html lang="en">\n<head>\n${head}\n</head>\n<body>\n${body}</body>\n</html>\n`,
);
console.log("sheets", sheets.length, "terms", Object.keys(gloss).length);

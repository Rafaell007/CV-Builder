// Finds the tools that the plan page needs, for Windows, macOS and Linux, and says what to install when one is missing.
// Used by build-charts.mjs, build-plan.mjs, build-plan-a4.mjs and verify-print.mjs.
// Run `node env.mjs` to see the report. It starts no browser and reads no plan file.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const PLATFORM = process.platform; // "win32" | "darwin" | "linux"

// The folder of the plan pages when nothing else is set. It is git-ignored (see .gitignore).
// The ticket-to-plan skill uses the same folder, so .gitignore needs no new line.
const DEFAULT_OUT = ".ticket-plans";

/**
 * The folder where the plan page is written. In this order:
 *   1. STORY_FLOW_OUT, when it is set (the folder must exist);
 *   2. `maciek/` in the current folder, when it exists (Maciek keeps his plans there);
 *   3. `.ticket-plans/` in the current folder.
 * Run the scripts from the repo root. `create: false` only reports the folder and does not make it.
 */
export function outDir({ create = true } = {}) {
  const own = process.env.STORY_FLOW_OUT;
  if (own) {
    if (!existsSync(own)) throw new Error(`STORY_FLOW_OUT does not exist: ${own}`);
    return own;
  }
  const personal = join(process.cwd(), "maciek");
  if (existsSync(personal)) return personal;
  const dir = join(process.cwd(), DEFAULT_OUT);
  if (create) mkdirSync(dir, { recursive: true });
  return dir;
}

// STORY_FLOW_SLUG names every file of one plan, so the scripts read it here and nowhere else.
export function slug() {
  const value = process.env.STORY_FLOW_SLUG;
  if (!value || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(value)) {
    throw new Error(
      "Set STORY_FLOW_SLUG to the story slug: lowercase words joined with hyphens, for example projects-search-sort.",
    );
  }
  return value;
}

// ---------- the browser (Edge, Chrome, Chromium or Brave: all print with the same flags) ----------

const programFiles = [
  process.env["ProgramFiles"],
  process.env["ProgramFiles(x86)"],
  process.env["LocalAppData"],
].filter((dir) => dir !== undefined);

const BROWSERS = {
  darwin: [
    ["Microsoft Edge", "Microsoft Edge.app/Contents/MacOS/Microsoft Edge"],
    ["Google Chrome", "Google Chrome.app/Contents/MacOS/Google Chrome"],
    ["Chromium", "Chromium.app/Contents/MacOS/Chromium"],
    ["Brave", "Brave Browser.app/Contents/MacOS/Brave Browser"],
  ].flatMap(([name, app]) =>
    ["/Applications", join(homedir(), "Applications")].map((dir) => ({
      name,
      path: join(dir, app),
    })),
  ),
  win32: [
    ["Microsoft Edge", "Microsoft/Edge/Application/msedge.exe"],
    ["Google Chrome", "Google/Chrome/Application/chrome.exe"],
    ["Brave", "BraveSoftware/Brave-Browser/Application/brave.exe"],
  ].flatMap(([name, exe]) => programFiles.map((dir) => ({ name, path: join(dir, exe) }))),
  linux: ["microsoft-edge", "google-chrome", "chromium", "chromium-browser"].map((name) => ({
    name,
    path: name,
  })),
};

function findOnPath(name) {
  const result = spawnSync(PLATFORM === "win32" ? "where" : "which", [name], { encoding: "utf8" });
  return result.status === 0 ? result.stdout.split(/\r?\n/)[0] : undefined;
}

/** `{ name, path }` of the first browser found (STORY_FLOW_BROWSER wins), or undefined. */
export function findBrowser() {
  const own = process.env.STORY_FLOW_BROWSER;
  if (own && existsSync(own)) return { name: "STORY_FLOW_BROWSER", path: own };
  for (const candidate of BROWSERS[PLATFORM] ?? []) {
    const path =
      PLATFORM === "linux"
        ? findOnPath(candidate.path)
        : existsSync(candidate.path)
          ? candidate.path
          : undefined;
    if (path) return { name: candidate.name, path };
  }
  return undefined;
}

// ---------- the PDF text reader (pdftotext, or the PDF tool that macOS has built in) ----------

/** `{ kind: "pdftotext" | "pdfkit", path }`, or undefined when neither exists. */
export function findPdfText() {
  const path = findOnPath("pdftotext");
  if (path) return { kind: "pdftotext", path };
  if (PLATFORM === "darwin" && findOnPath("osascript"))
    return { kind: "pdfkit", path: "osascript (macOS PDFKit)" };
  return undefined;
}

// JXA script: prints the text of each page, pages separated by a form feed. The PDF path is an argument, not part of the script.
const PDFKIT_SCRIPT = `
ObjC.import("PDFKit");
function run(argv) {
  const doc = $.PDFDocument.alloc.initWithURL($.NSURL.fileURLWithPath(argv[0]));
  const pages = [];
  for (let i = 0; i < doc.pageCount; i++) pages.push(ObjC.unwrap(doc.pageAtIndex(i).string));
  return pages.join("\\f");
}`;

/** The text of each page of a PDF, as an array. Returns undefined when no reader is installed. */
export function readPdfPages(pdfPath, reader = findPdfText()) {
  if (!reader) return undefined;
  const run =
    reader.kind === "pdftotext"
      ? spawnSync("pdftotext", ["-layout", pdfPath, "-"], {
          encoding: "utf8",
          maxBuffer: 64 * 1024 * 1024,
        })
      : spawnSync("osascript", ["-l", "JavaScript", "-e", PDFKIT_SCRIPT, pdfPath], {
          encoding: "utf8",
          maxBuffer: 64 * 1024 * 1024,
        });
  if (run.status !== 0) throw new Error(`Could not read ${pdfPath}: ${run.stderr}`);
  const pages = run.stdout.replace(/\n$/, "").split("\f");
  // pdftotext ends with a form feed, which leaves one empty last item.
  return pages.length > 1 && pages[pages.length - 1].trim() === "" ? pages.slice(0, -1) : pages;
}

/** Page count without a reader: counts the page objects of the PDF. The text of the pages stays unknown. */
export function countPdfPages(pdfPath) {
  return (readFileSync(pdfPath, "latin1").match(/\/Type\s*\/Page(?![a-z])/g) ?? []).length;
}

// ---------- what to install when something is missing ----------

export const HINTS = {
  browser: {
    darwin:
      "Install Google Chrome or Microsoft Edge: `brew install --cask google-chrome`, or set STORY_FLOW_BROWSER to the browser file.",
    win32:
      "Microsoft Edge comes with Windows 10 and 11. Or install Google Chrome. You can also set STORY_FLOW_BROWSER to the browser file.",
    linux:
      "Install a browser: `sudo apt install chromium` (the package is `chromium-browser` on some systems), or set STORY_FLOW_BROWSER.",
  },
  pdfText: {
    darwin:
      "Not needed: macOS has a built-in PDF reader. To use pdftotext anyway: `brew install poppler`.",
    win32:
      "Install Poppler, which has pdftotext: `scoop install poppler` or `choco install poppler`. Without it the check counts pages only.",
    linux:
      "Install Poppler: `sudo apt install poppler-utils`. Without it the check counts pages only.",
  },
};

// ---------- the report: `node env.mjs` ----------

function report() {
  const browser = findBrowser();
  const reader = findPdfText();
  const lines = [
    `System:      ${PLATFORM} ${process.arch}`,
    `Node:        ${process.version}`,
    `Browser:     ${browser ? `OK, ${browser.name} (${browser.path})` : `MISSING. ${HINTS.browser[PLATFORM] ?? ""}`}`,
    `PDF reader:  ${
      reader
        ? `OK, ${reader.kind === "pdfkit" ? "macOS built-in PDFKit" : `pdftotext (${reader.path})`}`
        : `MISSING (page count only). ${HINTS.pdfText[PLATFORM] ?? ""}`
    }`,
  ];
  try {
    lines.push(`Output:      ${outDir({ create: false })}`);
  } catch (error) {
    lines.push(`Output:      MISSING. ${error.message}`);
  }
  console.log(lines.join("\n"));
  return browser !== undefined;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = report() ? 0 : 1;
}

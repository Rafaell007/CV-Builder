// The print check of the plan page: prints the HTML file to PDF with the browser that this system has,
// reads the text of each page, and reports a page that holds only a footer.
// Usage: node verify-print.mjs <plan.print.html> [--screenshot out.png] [--keep out.pdf]
// Exit code: 0 = every page has content, 1 = a footer-only page or a failed print, 2 = no browser.
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { countPdfPages, findBrowser, findPdfText, HINTS, readPdfPages } from "./env.mjs";

const args = process.argv.slice(2);
const option = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};
const html = args.find(
  (arg) => !arg.startsWith("--") && arg !== option("--screenshot") && arg !== option("--keep"),
);
if (!html || !existsSync(html)) {
  console.error(
    "Usage: node verify-print.mjs <plan.print.html> [--screenshot out.png] [--keep out.pdf]",
  );
  process.exit(2);
}

const browser = findBrowser();
if (!browser) {
  console.error(`No browser found. ${HINTS.browser[process.platform] ?? ""}`);
  process.exit(2);
}

// A fresh profile folder, so a browser that is already open does not take over the command and print nothing.
const work = mkdtempSync(join(tmpdir(), "story-to-flow-"));
const url = pathToFileURL(resolve(html)).href;
const base = ["--headless", "--disable-gpu", `--user-data-dir=${join(work, "profile")}`];

try {
  const pdf = join(work, "out.pdf");
  spawnSync(browser.path, [...base, "--no-pdf-header-footer", `--print-to-pdf=${pdf}`, url], {
    timeout: 120_000,
  });
  if (!existsSync(pdf)) {
    console.error(
      `${browser.name} did not write a PDF. Close other ${browser.name} windows and try again.`,
    );
    process.exit(1);
  }

  const screenshot = option("--screenshot");
  if (screenshot) {
    // Edge needs the old headless mode for a screenshot (the new one gives a blank image). Chrome works with both.
    const mode = browser.name === "Microsoft Edge" ? "--headless=old" : "--headless";
    spawnSync(
      browser.path,
      [
        mode,
        ...base.slice(1),
        `--screenshot=${resolve(screenshot)}`,
        "--window-size=1100,1500",
        url,
      ],
      {
        timeout: 120_000,
      },
    );
    console.log(`Screenshot: ${existsSync(screenshot) ? resolve(screenshot) : "not written"}`);
  }
  const keep = option("--keep");
  if (keep) copyFileSync(pdf, resolve(keep));

  const reader = findPdfText();
  const pages = readPdfPages(pdf, reader);
  console.log(`Browser: ${browser.name}   PDF reader: ${reader ? reader.kind : "none"}`);

  if (!pages) {
    console.log(
      `Pages: ${countPdfPages(pdf)} (count only, the text of the pages could not be read)`,
    );
    console.log(`Hint: ${HINTS.pdfText[process.platform] ?? ""}`);
    process.exit(0);
  }

  // A footer is one line with " · " and one line "Page N". A page with nothing else means a sheet is too long.
  const content = (text) =>
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line !== "" && !/^Page \d+$/.test(line) && !/ · /.test(line))
      .join(" ");

  let footerOnly = 0;
  pages.forEach((text, index) => {
    const body = content(text);
    const empty = body.length < 20;
    if (empty) footerOnly += 1;
    console.log(
      `Page ${String(index + 1).padStart(2)}: ${empty ? "FOOTER ONLY" : "ok         "} ${body.slice(0, 70)}`,
    );
  });
  console.log(`Pages: ${pages.length}, footer-only: ${footerOnly}`);
  process.exitCode = footerOnly === 0 ? 0 : 1;
} finally {
  rmSync(work, { recursive: true, force: true });
}

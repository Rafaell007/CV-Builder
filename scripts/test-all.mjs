// Runs every test suite in turn and prints a summary table at the end.
// Stops at the first failing suite, like the former `&&` chain did.
import { spawn } from "node:child_process";

const ANSI = /\x1b\[[0-9;]*m/g;

// Each parser reads the tool's own summary line and returns the total number of tests.
const parseVitest = (out) => {
  const match = out.match(/^\s*Tests\s+.*\((\d+)\)\s*$/m);
  return match ? Number(match[1]) : null;
};
const parseJest = (out) => {
  const match = out.match(/^Tests:\s+.*?(\d+) total/m);
  return match ? Number(match[1]) : null;
};
const parsePlaywright = (out) => {
  const counts = [
    ...out.matchAll(/^\s*(\d+) (?:passed|failed|flaky|skipped|interrupted|did not run)\b/gm),
  ];
  return counts.length ? counts.reduce((sum, match) => sum + Number(match[1]), 0) : null;
};

const suites = [
  {
    name: "Frontend unit + stories",
    command: "pnpm --filter @cv-builder/frontend test",
    parse: parseVitest,
  },
  { name: "Backend unit", command: "pnpm --filter @cv-builder/backend test", parse: parseJest },
  {
    name: "Backend integration",
    command: "pnpm --filter @cv-builder/backend test:int",
    parse: parseJest,
  },
  { name: "E2E", command: "pnpm test:e2e", parse: parsePlaywright },
];

function run(command) {
  return new Promise((resolve) => {
    let output = "";
    // FORCE_COLOR keeps the colors in the terminal although the output goes through a pipe.
    const child = spawn(command, {
      shell: true,
      stdio: ["inherit", "pipe", "pipe"],
      env: { ...process.env, FORCE_COLOR: "1" },
    });
    const collect = (stream, target) =>
      stream.on("data", (chunk) => {
        target.write(chunk);
        output += chunk.toString();
      });
    collect(child.stdout, process.stdout);
    collect(child.stderr, process.stderr);
    child.on("close", (code) => resolve({ code: code ?? 1, output: output.replace(ANSI, "") }));
  });
}

const formatTime = (ms) =>
  ms < 60_000
    ? `${(ms / 1000).toFixed(1)}s`
    : `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`;

function printSummary(rows) {
  const total = {
    name: "Total",
    status: "",
    tests: rows.reduce((sum, row) => sum + (row.tests ?? 0), 0),
    ms: rows.reduce((sum, row) => sum + row.ms, 0),
  };
  const lines = [...rows, total].map((row) => [
    row.name,
    row.status,
    row.tests === null ? "?" : String(row.tests),
    formatTime(row.ms),
  ]);
  const header = ["Suite", "Result", "Tests", "Time"];
  const widths = header.map((title, i) =>
    Math.max(title.length, ...lines.map((line) => line[i].length)),
  );
  const format = (cells) =>
    `│ ${cells.map((cell, i) => (i < 2 ? cell.padEnd(widths[i]) : cell.padStart(widths[i]))).join(" │ ")} │`;
  const rule = (left, middle, right) =>
    `${left}${widths.map((width) => "─".repeat(width + 2)).join(middle)}${right}`;

  console.log("\nTest summary\n");
  console.log(rule("┌", "┬", "┐"));
  console.log(format(header));
  console.log(rule("├", "┼", "┤"));
  lines.slice(0, -1).forEach((line) => console.log(format(line)));
  console.log(rule("├", "┼", "┤"));
  console.log(format(lines.at(-1)));
  console.log(rule("└", "┴", "┘"));
}

const rows = [];
let exitCode = 0;
for (const suite of suites) {
  console.log(`\n=== ${suite.name} ===\n`);
  const start = performance.now();
  const { code, output } = await run(suite.command);
  rows.push({
    name: suite.name,
    status: code === 0 ? "passed" : "FAILED",
    tests: suite.parse(output),
    ms: performance.now() - start,
  });
  if (code !== 0) {
    exitCode = code;
    break;
  }
}
printSummary(rows);
process.exit(exitCode);

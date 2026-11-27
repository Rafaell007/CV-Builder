// PreToolUse hook: asks the user before an agent writes to the read-only plan files (AGENTS.md, "Plan is read-only").
import { relative, resolve } from "node:path";

const PROTECTED = [/^PLAN\.md$/, /^docs\/pages\//];
// Best-effort check of Bash commands: a protected path together with a command that writes.
const WRITES =
  /(\bsed\s+-\S*i|\bperl\s+-\S*i|>|\btee\b|\bmv\b|\bcp\b|\brm\b|\bgit\s+(checkout|restore|apply|stash)\b|\bpython3?\b|\bnode\b|\bawk\b|\bsponge\b)/;

const input = JSON.parse(
  await new Promise((done) => {
    let data = "";
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => done(data));
  }),
);

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const isProtectedPath = (path) =>
  PROTECTED.some((pattern) =>
    pattern.test(relative(root, resolve(root, path)).replaceAll("\\", "/")),
  );

const { tool_name: tool, tool_input: args = {} } = input;
let hit = false;
if (tool === "Bash") {
  const command = String(args.command ?? "").replace(/\d?>\s*\/dev\/null|\d?>&\d/g, "");
  hit = /PLAN\.md|docs\/pages/.test(command) && WRITES.test(command);
} else {
  hit = isProtectedPath(String(args.file_path ?? args.notebook_path ?? ""));
}

if (hit) {
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "ask",
        permissionDecisionReason:
          "PLAN.md and docs/pages/ are read-only (AGENTS.md). Approve only if you asked for this plan change. Otherwise fix the code, not the plan.",
      },
    }),
  );
}

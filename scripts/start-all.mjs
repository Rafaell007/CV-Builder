// Starts the Docker services (PostgreSQL, Mailpit), then the backend, the frontend and Storybook together.
// Every output line gets the name of its host. Ctrl+C stops all of them; Docker keeps running.
import { spawn, spawnSync } from "node:child_process";
import { createInterface } from "node:readline";

// `--wait` returns only when the services pass their health checks.
const docker = spawnSync("docker compose up -d --wait", { shell: true, stdio: "inherit" });
if (docker.status !== 0) process.exit(docker.status ?? 1);

const hosts = [
  {
    name: "backend",
    url: "http://localhost:4000/graphql",
    command: "pnpm --filter @cv-builder/backend dev",
  },
  {
    name: "frontend",
    url: "http://localhost:3000",
    command: "pnpm --filter @cv-builder/frontend dev",
  },
  {
    name: "storybook",
    url: "http://localhost:6006",
    command: "pnpm --filter @cv-builder/frontend storybook",
  },
];

const width = Math.max(...hosts.map((host) => host.name.length));
console.log("\nStarting:");
hosts.forEach((host) => console.log(`  ${host.name.padEnd(width)}  ${host.url}`));
console.log("\nPress Ctrl+C to stop.\n");

const children = hosts.map((host) => {
  // FORCE_COLOR keeps the colors in the terminal although the output goes through a pipe.
  const child = spawn(host.command, {
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, FORCE_COLOR: "1" },
  });
  const prefix = `[${host.name}]`.padEnd(width + 2);
  for (const stream of [child.stdout, child.stderr]) {
    createInterface({ input: stream }).on("line", (line) => console.log(`${prefix} ${line}`));
  }
  child.on("close", (code) => {
    console.log(`${prefix} stopped (exit code ${code ?? "none"})`);
  });
  return child;
});

// Ctrl+C reaches the children too (same process group); this only waits for them and exits once all are done.
process.on("SIGINT", () => {});
await Promise.all(children.map((child) => new Promise((resolve) => child.on("close", resolve))));
process.exit(0);

import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("db scripts", () => {
  const packageJson: { scripts: Record<string, string> } = JSON.parse(
    readFileSync(join(__dirname, "../../package.json"), "utf8"),
  );

  it("runs the seed guard before db:reset drops the database", () => {
    const steps = packageJson.scripts["db:reset"]?.split("&&").map((step) => step.trim()) ?? [];

    expect(steps.indexOf("tsx prisma/check-seed-target.ts")).toBe(0);
    expect(steps).toContain("prisma migrate reset");
  });
});

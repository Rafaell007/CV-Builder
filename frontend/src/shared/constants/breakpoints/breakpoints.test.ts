import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DESKTOP_MIN_WIDTH } from "./breakpoints";

// CSS cannot read DESKTOP_MIN_WIDTH, so the shared components repeat it. Same value as AppShell: 0.02px below the limit.
const NARROW_MAX_WIDTH = `${DESKTOP_MIN_WIDTH - 0.02}px`;

// Tests run from the frontend folder.
const SHARED_CSS_FILES = [
  "src/shared/components/ListPage/ListPage.module.css",
  "src/shared/components/DataTable/DataTable.module.css",
];

describe("DESKTOP_MIN_WIDTH", () => {
  it.each(SHARED_CSS_FILES)("is repeated in %s as the narrow max-width", (file) => {
    const css = readFileSync(resolve(file), "utf8");
    const limits = [...css.matchAll(/@media \(max-width: ([\d.]+px)\)/g)].map((match) => match[1]);

    expect(limits.length).toBeGreaterThan(0);
    expect(new Set(limits)).toEqual(new Set([NARROW_MAX_WIDTH]));
  });
});

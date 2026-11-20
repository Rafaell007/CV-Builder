import { lastUsedYear } from "./last-used-year";
import type { PreviewProject } from "./preview-project";
import { inTimeZoneUtcMinus11 } from "./time-zone.testing";

const NOW = new Date("2026-06-15T00:00:00Z");

function projectUsing(skillIds: string[], end: string | null): PreviewProject {
  return {
    skillIds,
    domain: "IoT",
    startDate: new Date("2020-01-01T00:00:00Z"),
    endDate: end === null ? null : new Date(`${end}T00:00:00Z`),
  };
}

describe("lastUsedYear", () => {
  it("takes the most recent of two React projects (12.2023 and 06.2025 give 2025)", () => {
    const projects = [projectUsing(["react"], "2023-12-31"), projectUsing(["react"], "2025-06-30")];

    expect(lastUsedYear("react", projects, NOW)).toBe(2025);
  });

  it("does not depend on the order of the projects", () => {
    const projects = [projectUsing(["react"], "2025-06-30"), projectUsing(["react"], "2023-12-31")];

    expect(lastUsedYear("react", projects, NOW)).toBe(2025);
  });

  it("gives the current year for an active project", () => {
    expect(lastUsedYear("react", [projectUsing(["react"], null)], NOW)).toBe(2026);
  });

  it("treats an active project as more recent than a finished one", () => {
    const projects = [projectUsing(["react"], "2025-06-30"), projectUsing(["react"], null)];

    expect(lastUsedYear("react", projects, NOW)).toBe(2026);
  });

  it("gives nothing when no project uses the skill", () => {
    expect(lastUsedYear("angular", [projectUsing(["react"], "2025-06-30")], NOW)).toBeNull();
  });

  it("gives nothing when there are no projects", () => {
    expect(lastUsedYear("react", [], NOW)).toBeNull();
  });

  it("ignores the projects that do not use the skill", () => {
    const projects = [projectUsing(["java"], null), projectUsing(["react"], "2022-05-01")];

    expect(lastUsedYear("react", projects, NOW)).toBe(2022);
  });

  // In UTC-11 the moment 01.01.2025 00:00 UTC is still 31.12.2024, so local time would give 2024.
  it("takes the end year in UTC, whatever the time zone of the server", () => {
    const projects = [projectUsing(["react"], "2025-01-01")];

    const year = inTimeZoneUtcMinus11(() => lastUsedYear("react", projects, NOW));

    expect(year).toBe(2025);
  });

  it("takes the current year of an active project in UTC, whatever the time zone of the server", () => {
    const projects = [projectUsing(["react"], null)];

    const year = inTimeZoneUtcMinus11(() =>
      lastUsedYear("react", projects, new Date("2026-01-01T00:00:00Z")),
    );

    expect(year).toBe(2026);
  });

  it("uses the end year at the year boundary", () => {
    const projects = [projectUsing(["react"], "2024-12-31"), projectUsing(["react"], "2025-01-01")];

    expect(lastUsedYear("react", projects, NOW)).toBe(2025);
  });
});

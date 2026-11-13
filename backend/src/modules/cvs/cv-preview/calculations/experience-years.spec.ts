import { experienceYears } from "./experience-years";
import type { PreviewProject } from "./preview-project";

const NOW = new Date("2026-06-15T00:00:00Z");

function projectUsing(skillIds: string[], start: string): PreviewProject {
  return { skillIds, domain: "IoT", startDate: new Date(`${start}T00:00:00Z`), endDate: null };
}

// The worked example of the docs page: two projects, four CV skills, current year 2026.
const EXAMPLE = [
  projectUsing(["react", "javascript"], "2022-03-01"),
  projectUsing(["typescript", "node"], "2023-06-01"),
];

describe("experienceYears", () => {
  it("gives 4 years for React and JavaScript (project from 01.03.2022)", () => {
    expect(experienceYears("react", EXAMPLE, NOW)).toBe(4);
    expect(experienceYears("javascript", EXAMPLE, NOW)).toBe(4);
  });

  it("gives 3 years for TypeScript (project from 01.06.2023)", () => {
    expect(experienceYears("typescript", EXAMPLE, NOW)).toBe(3);
  });

  it("gives no experience for a skill that no project uses (Angular)", () => {
    expect(experienceYears("angular", EXAMPLE, NOW)).toBeNull();
  });

  it("gives no experience when only projects of another CV use the skill", () => {
    // The caller passes only the projects of the current CV, so Node.js is missing here.
    const projectsOfThisCv = [projectUsing(["react", "javascript"], "2022-03-01")];

    expect(experienceYears("node", projectsOfThisCv, NOW)).toBeNull();
  });

  it("gives no experience when there are no projects", () => {
    expect(experienceYears("react", [], NOW)).toBeNull();
  });

  it("uses the earliest start date when a skill is in several projects", () => {
    const projects = [
      projectUsing(["react"], "2024-01-01"),
      projectUsing(["react"], "2020-01-01"),
      projectUsing(["react"], "2022-01-01"),
    ];

    expect(experienceYears("react", projects, NOW)).toBe(6);
  });

  it("ignores the projects that do not use the skill", () => {
    const projects = [projectUsing(["java"], "2010-01-01"), projectUsing(["react"], "2024-01-01")];

    expect(experienceYears("react", projects, NOW)).toBe(2);
  });

  it("rounds down: 4 years and 11 months is 4 years", () => {
    expect(experienceYears("react", [projectUsing(["react"], "2021-07-20")], NOW)).toBe(4);
  });

  it("counts the year on the exact anniversary", () => {
    expect(experienceYears("react", [projectUsing(["react"], "2022-06-15")], NOW)).toBe(4);
  });

  it("does not count the year on the day before the anniversary", () => {
    expect(experienceYears("react", [projectUsing(["react"], "2022-06-16")], NOW)).toBe(3);
  });

  it("counts the year on the day after the anniversary", () => {
    expect(experienceYears("react", [projectUsing(["react"], "2022-06-14")], NOW)).toBe(4);
  });

  it("handles the year boundary: 31.12.2025 to 01.01.2026 is 0 years", () => {
    expect(
      experienceYears(
        "react",
        [projectUsing(["react"], "2025-12-31")],
        new Date("2026-01-01T00:00:00Z"),
      ),
    ).toBe(0);
  });

  it("handles the year boundary: 01.01.2025 to 31.12.2025 is 0 years, to 01.01.2026 is 1 year", () => {
    const projects = [projectUsing(["react"], "2025-01-01")];

    expect(experienceYears("react", projects, new Date("2025-12-31T00:00:00Z"))).toBe(0);
    expect(experienceYears("react", projects, new Date("2026-01-01T00:00:00Z"))).toBe(1);
  });

  it("gives 0 when the project starts in the future", () => {
    expect(experienceYears("react", [projectUsing(["react"], "2028-01-01")], NOW)).toBe(0);
  });

  it("gives 0 when the project starts later in the current year", () => {
    expect(experienceYears("react", [projectUsing(["react"], "2026-09-01")], NOW)).toBe(0);
  });

  it("handles a 29 February start date in a non-leap year", () => {
    const projects = [projectUsing(["react"], "2024-02-29")];

    expect(experienceYears("react", projects, new Date("2025-02-28T00:00:00Z"))).toBe(0);
    expect(experienceYears("react", projects, new Date("2025-03-01T00:00:00Z"))).toBe(1);
  });

  it("counts the year on 29 February of a later leap year", () => {
    const projects = [projectUsing(["react"], "2024-02-29")];

    expect(experienceYears("react", projects, new Date("2028-02-29T00:00:00Z"))).toBe(4);
  });
});

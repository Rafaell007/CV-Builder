import type { PreviewProject } from "./preview-project";
import { uniqueDomains } from "./unique-domains";

function projectIn(domain: string): PreviewProject {
  return { skillIds: [], domain, startDate: new Date("2022-03-01T00:00:00Z"), endDate: null };
}

describe("uniqueDomains", () => {
  it("returns an empty list when there are no projects", () => {
    expect(uniqueDomains([])).toEqual([]);
  });

  it("returns a domain once when every project has it", () => {
    expect(uniqueDomains([projectIn("IoT"), projectIn("IoT"), projectIn("IoT")])).toEqual(["IoT"]);
  });

  it("keeps the order of first appearance", () => {
    expect(
      uniqueDomains([
        projectIn("IoT"),
        projectIn("FinTech"),
        projectIn("IoT"),
        projectIn("Healthcare"),
        projectIn("FinTech"),
      ]),
    ).toEqual(["IoT", "FinTech", "Healthcare"]);
  });
});

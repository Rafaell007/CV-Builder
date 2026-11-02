import { idOf } from "./ids";

describe("idOf", () => {
  const ids = new Map([["React", "skill-1"]]);

  it("returns the id seeded under the name", () => {
    expect(idOf(ids, "React")).toBe("skill-1");
  });

  it("throws and names the missing entry, so a typo in the seed data stops the seed", () => {
    expect(() => idOf(ids, "Reactt")).toThrow('Seed data refers to "Reactt"');
  });
});

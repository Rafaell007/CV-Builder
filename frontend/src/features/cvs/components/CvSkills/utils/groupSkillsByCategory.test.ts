import { describe, expect, it } from "vitest";
import { category, cvSkill } from "../cvSkills.mocks";
import { groupSkillsByCategory } from "./groupSkillsByCategory";

const frontend = category("c-1", "Frontend");
const backend = category("c-2", "Backend");

describe("groupSkillsByCategory", () => {
  it("returns no groups for no skills", () => {
    expect(groupSkillsByCategory([])).toEqual([]);
  });

  it("groups the skills by category and keeps the order of the list", () => {
    const react = cvSkill({ id: "1", name: "React", category: frontend });
    const vue = cvSkill({ id: "2", name: "Vue", category: frontend });
    const node = cvSkill({ id: "3", name: "Node.js", category: backend });

    const groups = groupSkillsByCategory([react, vue, node]);

    expect(groups).toEqual([
      { categoryId: "c-1", categoryName: "Frontend", skills: [react, vue] },
      { categoryId: "c-2", categoryName: "Backend", skills: [node] },
    ]);
  });

  it("makes one group per category id, also when the skills of a category are apart", () => {
    const first = cvSkill({ id: "1", category: frontend });
    const second = cvSkill({ id: "2", category: backend });
    const third = cvSkill({ id: "3", category: frontend });

    expect(groupSkillsByCategory([first, second, third]).map((group) => group.skills)).toEqual([
      [first, third],
      [second],
    ]);
  });
});

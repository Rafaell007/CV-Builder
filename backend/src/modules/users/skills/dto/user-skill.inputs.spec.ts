import { randomUUID } from "node:crypto";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { Mastery } from "../../../skills/models/mastery.enum";
import { MAX_REMOVED_USER_SKILLS, USER_SKILL_MASTERY_LEVELS } from "../user-skills.constants";
import { AddUserSkillInput } from "./add-user-skill.input";
import { RemoveUserSkillsInput } from "./remove-user-skills.input";
import { UpdateUserSkillInput } from "./update-user-skill.input";

const ID = "6f1d3c52-8a0e-4f6c-9a43-2b7d5e1c9a10";

type InputClass = new () => object;

async function failedFields(type: InputClass, plain: Record<string, unknown>): Promise<string[]> {
  const errors = await validate(plainToInstance(type, plain));
  return errors.map((error) => error.property);
}

describe("AddUserSkillInput", () => {
  const valid = { userId: ID, skillId: ID, mastery: Mastery.ADVANCED };

  it.each(USER_SKILL_MASTERY_LEVELS)("accepts the level %s", async (mastery) => {
    await expect(failedFields(AddUserSkillInput, { ...valid, mastery })).resolves.toEqual([]);
  });

  it("refuses NONE: it exists only for the skills of a CV", async () => {
    await expect(
      failedFields(AddUserSkillInput, { ...valid, mastery: Mastery.NONE }),
    ).resolves.toEqual(["mastery"]);
  });

  it("refuses a skill id that is not a UUID", async () => {
    await expect(failedFields(AddUserSkillInput, { ...valid, skillId: "" })).resolves.toEqual([
      "skillId",
    ]);
  });
});

describe("UpdateUserSkillInput", () => {
  it("accepts a level and refuses NONE", async () => {
    await expect(
      failedFields(UpdateUserSkillInput, { id: ID, mastery: Mastery.EXPERT }),
    ).resolves.toEqual([]);
    await expect(
      failedFields(UpdateUserSkillInput, { id: ID, mastery: Mastery.NONE }),
    ).resolves.toEqual(["mastery"]);
  });
});

describe("RemoveUserSkillsInput", () => {
  it("needs at least one id, all different, and at most the limit", async () => {
    const ids = Array.from({ length: MAX_REMOVED_USER_SKILLS + 1 }, () => randomUUID());

    await expect(
      failedFields(RemoveUserSkillsInput, {
        userId: ID,
        ids: ids.slice(0, MAX_REMOVED_USER_SKILLS),
      }),
    ).resolves.toEqual([]);
    await expect(failedFields(RemoveUserSkillsInput, { userId: ID, ids })).resolves.toEqual([
      "ids",
    ]);
    await expect(failedFields(RemoveUserSkillsInput, { userId: ID, ids: [] })).resolves.toEqual([
      "ids",
    ]);
    await expect(
      failedFields(RemoveUserSkillsInput, { userId: ID, ids: [ID, ID] }),
    ).resolves.toEqual(["ids"]);
  });
});

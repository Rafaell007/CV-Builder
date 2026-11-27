import { randomUUID } from "node:crypto";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CreateProjectInput, MAX_ENVIRONMENT_SKILLS } from "./create-project.input";
import { UpdateProjectInput } from "./update-project.input";

const ID = "6f1d3c52-8a0e-4f6c-9a43-2b7d5e1c9a10";

const VALID = {
  name: "Intranet",
  domain: "Banking",
  startDate: new Date("2026-01-01"),
  endDate: new Date("2026-06-30"),
  description: "A portal for employees",
  environmentIds: [ID],
};

async function failedFields(plain: Record<string, unknown>): Promise<string[]> {
  const errors = await validate(plainToInstance(CreateProjectInput, plain));
  return errors.map((error) => error.property);
}

describe("CreateProjectInput", () => {
  it("accepts a valid project", async () => {
    await expect(failedFields(VALID)).resolves.toEqual([]);
  });

  it("makes the environment optional and empty by default", () => {
    const withoutEnvironment: Record<string, unknown> = { ...VALID };
    delete withoutEnvironment.environmentIds;

    expect(plainToInstance(CreateProjectInput, withoutEnvironment).environmentIds).toEqual([]);
  });

  it("accepts the largest environment and rejects one skill more", async () => {
    const ids = Array.from({ length: MAX_ENVIRONMENT_SKILLS + 1 }, () => randomUUID());

    await expect(
      failedFields({ ...VALID, environmentIds: ids.slice(0, MAX_ENVIRONMENT_SKILLS) }),
    ).resolves.toEqual([]);
    await expect(failedFields({ ...VALID, environmentIds: ids })).resolves.toEqual([
      "environmentIds",
    ]);
  });

  it.each(["name", "domain", "description"])(
    "trims %s and rejects an empty value",
    async (field) => {
      await expect(failedFields({ ...VALID, [field]: "   " })).resolves.toEqual([field]);
    },
  );

  it.each([
    ["name", 100],
    ["domain", 100],
    ["description", 2000],
  ])("accepts %s at the limit and rejects one character more", async (field, limit) => {
    await expect(failedFields({ ...VALID, [field]: "a".repeat(limit) })).resolves.toEqual([]);
    await expect(failedFields({ ...VALID, [field]: "a".repeat(limit + 1) })).resolves.toEqual([
      field,
    ]);
  });

  it.each(["startDate", "endDate"])("rejects a %s that is not a date", async (field) => {
    await expect(failedFields({ ...VALID, [field]: "tomorrow" })).resolves.toEqual([field]);
  });

  it("rejects a duplicate technology", async () => {
    await expect(failedFields({ ...VALID, environmentIds: [ID, ID] })).resolves.toEqual([
      "environmentIds",
    ]);
  });

  it("rejects an id that is not a UUID", async () => {
    await expect(failedFields({ ...VALID, environmentIds: ["not-an-id"] })).resolves.toEqual([
      "environmentIds",
    ]);
  });
});

describe("UpdateProjectInput", () => {
  it("also needs a project id that is a UUID", async () => {
    const errors = await validate(plainToInstance(UpdateProjectInput, { ...VALID, id: "1" }));

    expect(errors.map((error) => error.property)).toEqual(["id"]);
  });
});

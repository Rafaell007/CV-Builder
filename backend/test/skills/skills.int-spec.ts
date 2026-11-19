import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { Mastery, Role } from "../../src/generated/prisma/enums";
import { PrismaService } from "../../src/prisma/prisma.service";
import { createTestApp } from "../support/create-test-app";
import { createUser, TEST_PASSWORD } from "../support/create-user";
import { graphqlRequest, toCookiePair } from "../support/graphql-request";
import type { GraphQLBody } from "../support/graphql-request";

const SIGN_IN = `mutation ($input: SignInInput!) { signIn(input: $input) { id } }`;

const SKILLS = `{ skills { id name } }`;
const CATALOG = `query ($search: String, $sort: SortInput, $page: PageInput) {
  skillCatalog(search: $search, sort: $sort, page: $page) {
    items { id name category { id name type } }
    total
  }
}`;
const CATEGORIES = `{ skillCategories { id name type } }`;
const CREATE = `mutation ($input: CreateSkillInput!) {
  createSkill(input: $input) { id name category { id name type } }
}`;
const UPDATE = `mutation ($input: UpdateSkillInput!) {
  updateSkill(input: $input) { id name category { id name type } }
}`;
const DELETE = `mutation ($id: ID!) { deleteSkill(id: $id) }`;

const MISSING_ID = "00000000-0000-4000-8000-000000000000";

interface CatalogSkill {
  id: string;
  name: string;
  category: { id: string; name: string; type: string };
}

describe("skills", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let admin: string[];
  let user: string[];
  let userId: string;
  let frontend: { id: string; name: string; type: string };
  let tools: { id: string; name: string; type: string };

  async function signIn(email: string): Promise<string[]> {
    const { setCookies } = await graphqlRequest(app, SIGN_IN, {
      variables: { input: { email, password: TEST_PASSWORD } },
    });
    return setCookies.map(toCookiePair);
  }

  async function createSkill(name: string, categoryId = frontend.id): Promise<string> {
    const { body } = await graphqlRequest(app, CREATE, {
      cookies: admin,
      variables: { input: { name, categoryId } },
    });
    expect(body.errors).toBeUndefined();
    return (body.data as { createSkill: { id: string } }).createSkill.id;
  }

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    await createUser(app, { email: "admin@example.com", role: Role.ADMIN });
    userId = (await createUser(app, { email: "user@example.com" })).id;
    admin = await signIn("admin@example.com");
    user = await signIn("user@example.com");
    const select = { id: true, name: true, type: true };
    frontend = await prisma.skillCategory.create({
      data: { name: "Frontend", type: "Programming technologies" },
      select,
    });
    tools = await prisma.skillCategory.create({
      data: { name: "Build tools", type: "Tools" },
      select,
    });
  });

  beforeEach(async () => {
    // The rows that use a skill go first, because they block its delete (D18).
    await prisma.cv.deleteMany();
    await prisma.userSkill.deleteMany();
    await prisma.project.deleteMany();
    await prisma.skill.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("authorization", () => {
    const operations: [string, string, () => Record<string, unknown>][] = [
      ["skills", SKILLS, () => ({})],
      ["skillCatalog", CATALOG, () => ({})],
      ["skillCategories", CATEGORIES, () => ({})],
      ["createSkill", CREATE, () => ({ input: { name: "React", categoryId: frontend.id } })],
      [
        "updateSkill",
        UPDATE,
        () => ({ input: { id: MISSING_ID, name: "React", categoryId: frontend.id } }),
      ],
      ["deleteSkill", DELETE, () => ({ id: MISSING_ID })],
    ];

    it.each(operations)(
      "%s refuses a visitor who is not signed in",
      async (_name, query, variables) => {
        const { body } = await graphqlRequest(app, query, { variables: variables() });

        expect(body.errors?.[0]?.extensions.code).toBe("UNAUTHENTICATED");
      },
    );

    it.each(operations)(
      "%s refuses a user who is not an admin",
      async (_name, query, variables) => {
        const { body } = await graphqlRequest(app, query, {
          cookies: user,
          variables: variables(),
        });

        expect(body.errors?.[0]?.extensions.code).toBe("FORBIDDEN");
      },
    );

    it("does not change data when a user who is not an admin tries to create a skill", async () => {
      await graphqlRequest(app, CREATE, {
        cookies: user,
        variables: { input: { name: "React", categoryId: frontend.id } },
      });

      await expect(prisma.skill.count()).resolves.toBe(0);
    });
  });

  describe("skills", () => {
    it("lists every skill as id and name, by name", async () => {
      await createSkill("TypeScript");
      await createSkill("React");

      const { body } = await graphqlRequest(app, SKILLS, { cookies: admin });

      expect(body.errors).toBeUndefined();
      expect((body.data as { skills: { name: string }[] }).skills.map((s) => s.name)).toEqual([
        "React",
        "TypeScript",
      ]);
    });
  });

  describe("skillCategories", () => {
    it("lists every category with its type, by name", async () => {
      const { body } = await graphqlRequest(app, CATEGORIES, { cookies: admin });

      expect(body).toEqual({ data: { skillCategories: [tools, frontend] } });
    });
  });

  describe("createSkill", () => {
    it("creates a skill, normalises the spaces and returns the type of its category", async () => {
      const { body } = await graphqlRequest(app, CREATE, {
        cookies: admin,
        variables: { input: { name: "  React   Native  ", categoryId: frontend.id } },
      });

      expect(body.errors).toBeUndefined();
      const created = (body.data as { createSkill: CatalogSkill }).createSkill;
      expect(created).toMatchObject({ name: "React Native", category: frontend });
      await expect(
        prisma.skill.findUniqueOrThrow({ where: { id: created.id } }),
      ).resolves.toMatchObject({ name: "React Native", categoryId: frontend.id });
    });

    it.each([
      ["an empty name", ""],
      ["a name of only spaces", "   "],
      ["a name longer than 100 characters", "a".repeat(101)],
    ])("rejects %s with a field error", async (_case, name) => {
      const { body } = await graphqlRequest(app, CREATE, {
        cookies: admin,
        variables: { input: { name, categoryId: frontend.id } },
      });

      expect(body.errors?.[0]?.extensions).toMatchObject({
        code: "BAD_USER_INPUT",
        fieldErrors: [expect.objectContaining({ field: "name" })],
      });
      await expect(prisma.skill.count()).resolves.toBe(0);
    });

    it("accepts a name of exactly 100 characters", async () => {
      await createSkill("a".repeat(100));

      await expect(prisma.skill.count()).resolves.toBe(1);
    });

    it("rejects a category id that is not a UUID with a field error", async () => {
      const { body } = await graphqlRequest(app, CREATE, {
        cookies: admin,
        variables: { input: { name: "React", categoryId: "1" } },
      });

      expect(body.errors?.[0]?.extensions).toMatchObject({
        code: "BAD_USER_INPUT",
        fieldErrors: [expect.objectContaining({ field: "categoryId" })],
      });
    });

    it("rejects an unknown category with a field error", async () => {
      const { body } = await graphqlRequest(app, CREATE, {
        cookies: admin,
        variables: { input: { name: "React", categoryId: MISSING_ID } },
      });

      expect(body.errors?.[0]?.extensions).toMatchObject({
        code: "BAD_USER_INPUT",
        fieldErrors: [{ field: "categoryId", messages: ["Category not found"] }],
      });
      await expect(prisma.skill.count()).resolves.toBe(0);
    });

    it("does not accept a type from the client", async () => {
      // GraphQL refuses the unknown input field before the resolver runs, with HTTP 400,
      // so this request goes without graphqlRequest (it expects 200).
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .set("Cookie", admin.join("; "))
        .send({
          query: CREATE,
          variables: { input: { name: "React", categoryId: frontend.id, type: "Tools" } },
        })
        .expect(400);

      expect((response.body as GraphQLBody).errors?.[0]?.extensions.code).toBe("BAD_USER_INPUT");
      await expect(prisma.skill.count()).resolves.toBe(0);
    });

    it.each([
      ["the same name", "React"],
      ["spaces around and inside", "  React "],
      ["other letter case", "rEACT"],
    ])("fails with CONFLICT for a name that already exists, with %s (D35)", async (_case, name) => {
      await createSkill("React");

      const { body } = await graphqlRequest(app, CREATE, {
        cookies: admin,
        variables: { input: { name, categoryId: tools.id } },
      });

      expect(body.errors?.[0]).toMatchObject({
        message: "Skill already exists",
        extensions: { code: "CONFLICT" },
      });
      await expect(prisma.skill.count()).resolves.toBe(1);
    });
  });

  describe("database rules (D35)", () => {
    it("refuses a name that differs only in letter case, even without the service", async () => {
      await prisma.skill.create({ data: { name: "React", categoryId: frontend.id } });

      await expect(
        prisma.skill.create({ data: { name: "react", categoryId: frontend.id } }),
      ).rejects.toMatchObject({ code: "P2002" });
    });

    it("refuses a name longer than 100 characters, even without the service", async () => {
      await expect(
        prisma.skill.create({ data: { name: "a".repeat(101), categoryId: frontend.id } }),
      ).rejects.toThrow(/Skill_name_length_check/);
    });
  });

  describe("skillCatalog", () => {
    beforeEach(async () => {
      await createSkill("TypeScript");
      await createSkill("React");
      await createSkill("Webpack", tools.id);
    });

    async function names(variables: Record<string, unknown> = {}): Promise<string[]> {
      const { body } = await graphqlRequest(app, CATALOG, { cookies: admin, variables });
      expect(body.errors).toBeUndefined();
      return (body.data as { skillCatalog: { items: CatalogSkill[] } }).skillCatalog.items.map(
        (s) => s.name,
      );
    }

    it("lists the skills with their category and type and the total, by name by default", async () => {
      const { body } = await graphqlRequest(app, CATALOG, { cookies: admin });

      const page = (body.data as { skillCatalog: { items: CatalogSkill[]; total: number } })
        .skillCatalog;
      expect(page.items.map((s) => [s.name, s.category.name, s.category.type])).toEqual([
        ["React", "Frontend", "Programming technologies"],
        ["TypeScript", "Frontend", "Programming technologies"],
        ["Webpack", "Build tools", "Tools"],
      ]);
      expect(page.total).toBe(3);
    });

    it("sorts by name descending", async () => {
      await expect(names({ sort: { field: "name", direction: "DESC" } })).resolves.toEqual([
        "Webpack",
        "TypeScript",
        "React",
      ]);
    });

    it("sorts without regard to letter case (D35)", async () => {
      await createSkill("angular");

      await expect(names()).resolves.toEqual(["angular", "React", "TypeScript", "Webpack"]);
    });

    it("searches the name without regard to case", async () => {
      await expect(names({ search: "SCRIPT" })).resolves.toEqual(["TypeScript"]);
    });

    it("searches, sorts and pages together, and keeps the total of all matches", async () => {
      await createSkill("Redux");

      const { body } = await graphqlRequest(app, CATALOG, {
        cookies: admin,
        variables: {
          search: "re",
          sort: { field: "name", direction: "DESC" },
          page: { number: 2, size: 1 },
        },
      });

      const page = (body.data as { skillCatalog: { items: CatalogSkill[]; total: number } })
        .skillCatalog;
      expect(page.items.map((s) => s.name)).toEqual(["React"]);
      expect(page.total).toBe(2);
    });

    it("rejects a sort field that is not allowed", async () => {
      const { body } = await graphqlRequest(app, CATALOG, {
        cookies: admin,
        variables: { sort: { field: "createdAt", direction: "ASC" } },
      });

      expect(body.errors?.[0]?.extensions.code).toBe("BAD_USER_INPUT");
    });
  });

  describe("updateSkill", () => {
    it("changes the name and the category, and the type follows the new category", async () => {
      const id = await createSkill("React");

      const { body } = await graphqlRequest(app, UPDATE, {
        cookies: admin,
        variables: { input: { id, name: " React.js ", categoryId: tools.id } },
      });

      expect(body).toEqual({
        data: { updateSkill: { id, name: "React.js", category: tools } },
      });
      await expect(prisma.skill.findUniqueOrThrow({ where: { id } })).resolves.toMatchObject({
        name: "React.js",
        categoryId: tools.id,
      });
    });

    it("allows saving the same name again", async () => {
      const id = await createSkill("React");

      const { body } = await graphqlRequest(app, UPDATE, {
        cookies: admin,
        variables: { input: { id, name: "React", categoryId: frontend.id } },
      });

      expect(body.errors).toBeUndefined();
    });

    it("allows changing only the letter case of its own name", async () => {
      const id = await createSkill("React");

      const { body } = await graphqlRequest(app, UPDATE, {
        cookies: admin,
        variables: { input: { id, name: "REACT", categoryId: frontend.id } },
      });

      expect(body).toEqual({ data: { updateSkill: { id, name: "REACT", category: frontend } } });
    });

    it("fails with CONFLICT for the name of another skill, in any letter case", async () => {
      await createSkill("Vue");
      const id = await createSkill("React");

      const { body } = await graphqlRequest(app, UPDATE, {
        cookies: admin,
        variables: { input: { id, name: "vUE", categoryId: frontend.id } },
      });

      expect(body.errors?.[0]).toMatchObject({
        message: "Skill already exists",
        extensions: { code: "CONFLICT" },
      });
      await expect(prisma.skill.findUniqueOrThrow({ where: { id } })).resolves.toMatchObject({
        name: "React",
      });
    });

    it("rejects an unknown category with a field error and keeps the skill", async () => {
      const id = await createSkill("React");

      const { body } = await graphqlRequest(app, UPDATE, {
        cookies: admin,
        variables: { input: { id, name: "React", categoryId: MISSING_ID } },
      });

      expect(body.errors?.[0]?.extensions).toMatchObject({
        code: "BAD_USER_INPUT",
        fieldErrors: [{ field: "categoryId", messages: ["Category not found"] }],
      });
      await expect(prisma.skill.findUniqueOrThrow({ where: { id } })).resolves.toMatchObject({
        categoryId: frontend.id,
      });
    });

    it("fails with NOT_FOUND for an unknown skill", async () => {
      const { body } = await graphqlRequest(app, UPDATE, {
        cookies: admin,
        variables: { input: { id: MISSING_ID, name: "React", categoryId: frontend.id } },
      });

      expect(body.errors?.[0]).toMatchObject({
        message: "Skill not found",
        extensions: { code: "NOT_FOUND" },
      });
    });

    it("rejects an id that is not a UUID with a field error", async () => {
      const { body } = await graphqlRequest(app, UPDATE, {
        cookies: admin,
        variables: { input: { id: "1", name: "React", categoryId: frontend.id } },
      });

      expect(body.errors?.[0]?.extensions).toMatchObject({
        code: "BAD_USER_INPUT",
        fieldErrors: [expect.objectContaining({ field: "id" })],
      });
    });
  });

  describe("deleteSkill", () => {
    it("deletes a skill that nothing uses", async () => {
      const id = await createSkill("React");

      const { body } = await graphqlRequest(app, DELETE, { cookies: admin, variables: { id } });

      expect(body).toEqual({ data: { deleteSkill: true } });
      await expect(prisma.skill.count()).resolves.toBe(0);
    });

    // D18: the three places that use a skill.
    const uses: [string, (skillId: string) => Promise<unknown>][] = [
      [
        "a user has it",
        (skillId) =>
          prisma.userSkill.create({ data: { userId, skillId, mastery: Mastery.ADVANCED } }),
      ],
      [
        "a CV has it",
        (skillId) =>
          prisma.cv.create({
            data: {
              userId,
              name: "Frontend CV",
              education: "MSc",
              description: "Text",
              skills: { create: { skillId, mastery: Mastery.ADVANCED } },
            },
          }),
      ],
      [
        "a project environment has it",
        (skillId) =>
          prisma.project.create({
            data: {
              name: "Shop",
              domain: "E-commerce",
              startDate: new Date("2026-01-01"),
              endDate: new Date("2026-06-30"),
              description: "Text",
              skills: { create: { skillId } },
            },
          }),
      ],
    ];

    it.each(uses)("fails with CONFLICT when %s, and keeps the skill", async (_case, use) => {
      const id = await createSkill("React");
      await use(id);

      const { body } = await graphqlRequest(app, DELETE, { cookies: admin, variables: { id } });

      expect(body.errors?.[0]).toMatchObject({
        message: "Skill cannot be deleted because it is currently in use",
        extensions: { code: "CONFLICT" },
      });
      await expect(prisma.skill.count()).resolves.toBe(1);
    });

    it("fails with NOT_FOUND for an unknown skill", async () => {
      const { body } = await graphqlRequest(app, DELETE, {
        cookies: admin,
        variables: { id: MISSING_ID },
      });

      expect(body.errors?.[0]).toMatchObject({
        message: "Skill not found",
        extensions: { code: "NOT_FOUND" },
      });
    });

    it("fails with BAD_USER_INPUT for an id that is not a UUID", async () => {
      const { body } = await graphqlRequest(app, DELETE, {
        cookies: admin,
        variables: { id: "1" },
      });

      expect(body.errors?.[0]?.extensions.code).toBe("BAD_USER_INPUT");
    });
  });
});

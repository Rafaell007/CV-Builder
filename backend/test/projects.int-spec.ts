import { INestApplication } from "@nestjs/common";
import { Role } from "../src/generated/prisma/enums";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp } from "./support/create-test-app";
import { createUser, TEST_PASSWORD } from "./support/create-user";
import { graphqlRequest, toCookiePair } from "./support/graphql-request";

const SIGN_IN = `mutation ($input: SignInInput!) { signIn(input: $input) { id } }`;
const PROJECT_FIELDS = `id name domain startDate endDate description environment { id name }`;

const LIST = `query ($search: String, $sort: SortInput, $page: PageInput) {
  projects(search: $search, sort: $sort, page: $page) { items { ${PROJECT_FIELDS} } total }
}`;
const CREATE = `mutation ($input: CreateProjectInput!) { createProject(input: $input) { ${PROJECT_FIELDS} } }`;
const UPDATE = `mutation ($input: UpdateProjectInput!) { updateProject(input: $input) { ${PROJECT_FIELDS} } }`;
const DELETE = `mutation ($id: ID!) { deleteProject(id: $id) }`;
const ROLES = `{ projectRoles { id name } }`;

const MISSING_ID = "00000000-0000-4000-8000-000000000000";

describe("projects", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let admin: string[];
  let user: string[];
  let typescript: string;
  let react: string;

  async function signIn(email: string): Promise<string[]> {
    const { setCookies } = await graphqlRequest(app, SIGN_IN, {
      variables: { input: { email, password: TEST_PASSWORD } },
    });
    return setCookies.map(toCookiePair);
  }

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    await createUser(app, { email: "admin@example.com", role: Role.ADMIN });
    await createUser(app, { email: "user@example.com" });
    admin = await signIn("admin@example.com");
    user = await signIn("user@example.com");

    const category = await prisma.skillCategory.create({
      data: { name: "Languages", type: "TECH" },
    });
    typescript = (
      await prisma.skill.create({ data: { name: "TypeScript", categoryId: category.id } })
    ).id;
    react = (await prisma.skill.create({ data: { name: "React", categoryId: category.id } })).id;
  });

  beforeEach(async () => {
    await prisma.cvProject.deleteMany();
    await prisma.cv.deleteMany();
    await prisma.project.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  const input = (overrides: Record<string, unknown> = {}) => ({
    name: "Intranet",
    domain: "Banking",
    startDate: "2026-01-01",
    endDate: "2026-06-30",
    description: "A portal for employees",
    environmentIds: [typescript],
    ...overrides,
  });

  async function createProject(overrides: Record<string, unknown> = {}): Promise<string> {
    const { body } = await graphqlRequest(app, CREATE, {
      cookies: admin,
      variables: { input: input(overrides) },
    });
    expect(body.errors).toBeUndefined();
    return (body.data as { createProject: { id: string } }).createProject.id;
  }

  async function addToCv(projectId: string, startDate: string, endDate: string | null) {
    const owner = await prisma.user.findUniqueOrThrow({ where: { email: "user@example.com" } });
    const cv = await prisma.cv.create({
      data: { name: "CV", education: "MSc", description: "About", userId: owner.id },
    });
    await prisma.cvProject.create({
      data: {
        cvId: cv.id,
        projectId,
        startDate: new Date(startDate),
        endDate: endDate === null ? null : new Date(endDate),
      },
    });
  }

  describe("authorization (AC-3, AC-47)", () => {
    const operations: [string, string, Record<string, unknown>][] = [
      ["projects", LIST, {}],
      ["createProject", CREATE, { input: input({ environmentIds: [] }) }],
      ["updateProject", UPDATE, { input: { ...input({ environmentIds: [] }), id: MISSING_ID } }],
      ["deleteProject", DELETE, { id: MISSING_ID }],
    ];

    it.each(operations)(
      "%s refuses a visitor who is not signed in",
      async (_name, query, variables) => {
        const { body } = await graphqlRequest(app, query, { variables });

        expect(body.errors?.[0]?.extensions.code).toBe("UNAUTHENTICATED");
      },
    );

    it.each(operations)(
      "%s refuses a user who is not an admin",
      async (_name, query, variables) => {
        const { body } = await graphqlRequest(app, query, { cookies: user, variables });

        expect(body.errors?.[0]?.extensions.code).toBe("FORBIDDEN");
      },
    );

    it("does not change data when a user who is not an admin tries to create a project", async () => {
      await graphqlRequest(app, CREATE, { cookies: user, variables: { input: input() } });

      await expect(prisma.project.count()).resolves.toBe(0);
    });
  });

  describe("projectRoles", () => {
    it("lists the roles by name for any signed-in user", async () => {
      await prisma.projectRole.createMany({ data: [{ name: "Tester" }, { name: "Developer" }] });

      const { body } = await graphqlRequest(app, ROLES, { cookies: user });

      expect(body.errors).toBeUndefined();
      expect(
        (body.data as { projectRoles: { name: string }[] }).projectRoles.map((r) => r.name),
      ).toEqual(["Developer", "Tester"]);
    });

    it("refuses a visitor who is not signed in", async () => {
      const { body } = await graphqlRequest(app, ROLES);

      expect(body.errors?.[0]?.extensions.code).toBe("UNAUTHENTICATED");
    });
  });

  describe("createProject", () => {
    it("creates a project with its environment and keeps it (AC-14, AC-20, AC-41, AC-42)", async () => {
      const { body } = await graphqlRequest(app, CREATE, {
        cookies: admin,
        variables: { input: input({ environmentIds: [typescript, react] }) },
      });

      expect(body.errors).toBeUndefined();
      expect(body.data).toEqual({
        createProject: {
          id: expect.any(String),
          name: "Intranet",
          domain: "Banking",
          startDate: "2026-01-01T00:00:00.000Z",
          endDate: "2026-06-30T00:00:00.000Z",
          description: "A portal for employees",
          environment: [
            { id: react, name: "React" },
            { id: typescript, name: "TypeScript" },
          ],
        },
      });
      await expect(prisma.projectSkill.count()).resolves.toBe(2);
    });

    it("accepts a project without an environment and a one-day project", async () => {
      const { body } = await graphqlRequest(app, CREATE, {
        cookies: admin,
        variables: { input: input({ environmentIds: [], endDate: "2026-01-01" }) },
      });

      expect(body.errors).toBeUndefined();
    });

    it("trims the text fields", async () => {
      const id = await createProject({ name: "  Intranet  " });

      await expect(prisma.project.findUniqueOrThrow({ where: { id } })).resolves.toMatchObject({
        name: "Intranet",
      });
    });

    it.each([
      ["name", { name: "" }],
      ["name", { name: "a".repeat(101) }],
      ["domain", { domain: " " }],
      ["domain", { domain: "a".repeat(101) }],
      ["description", { description: "" }],
      ["description", { description: "a".repeat(2001) }],
      ["environmentIds", { environmentIds: [MISSING_ID, MISSING_ID] }],
    ])(
      "rejects an invalid %s with a field error (AC-15 to AC-18, AC-23)",
      async (field, overrides) => {
        const { body } = await graphqlRequest(app, CREATE, {
          cookies: admin,
          variables: { input: input(overrides) },
        });

        expect(body.errors?.[0]?.extensions).toMatchObject({
          code: "BAD_USER_INPUT",
          fieldErrors: [expect.objectContaining({ field })],
        });
        await expect(prisma.project.count()).resolves.toBe(0);
      },
    );

    it("rejects an end date before the start date (AC-19, AC-45)", async () => {
      const { body } = await graphqlRequest(app, CREATE, {
        cookies: admin,
        variables: { input: input({ startDate: "2026-07-01", endDate: "2026-06-30" }) },
      });

      expect(body.errors?.[0]?.extensions).toMatchObject({
        code: "BAD_USER_INPUT",
        fieldErrors: [
          { field: "endDate", messages: ["endDate must not be earlier than startDate"] },
        ],
      });
    });

    it("rejects a skill that does not exist (AC-46)", async () => {
      const { body } = await graphqlRequest(app, CREATE, {
        cookies: admin,
        variables: { input: input({ environmentIds: [MISSING_ID] }) },
      });

      expect(body.errors?.[0]?.extensions).toMatchObject({
        code: "BAD_USER_INPUT",
        fieldErrors: [expect.objectContaining({ field: "environmentIds" })],
      });
      await expect(prisma.project.count()).resolves.toBe(0);
    });
  });

  describe("projects", () => {
    beforeEach(async () => {
      await createProject({
        name: "Banking portal",
        domain: "Finance",
        startDate: "2026-03-01",
        endDate: "2026-09-01",
      });
      await createProject({
        name: "Shops app",
        domain: "Retail",
        startDate: "2026-01-01",
        endDate: "2026-12-31",
      });
      await createProject({
        name: "Clinic",
        domain: "BANKING insurance",
        startDate: "2026-02-01",
        endDate: "2026-04-01",
        environmentIds: [],
      });
    });

    const names = async (variables: Record<string, unknown>): Promise<string[]> => {
      const { body } = await graphqlRequest(app, LIST, { cookies: admin, variables });
      expect(body.errors).toBeUndefined();
      return (body.data as { projects: { items: { name: string }[] } }).projects.items.map(
        (p) => p.name,
      );
    };

    it("lists projects with environment and total, sorted by name by default (AC-4, AC-5)", async () => {
      const { body } = await graphqlRequest(app, LIST, { cookies: admin });

      const page = (
        body.data as {
          projects: { items: { name: string; environment: unknown[] }[]; total: number };
        }
      ).projects;
      expect(page.total).toBe(3);
      expect(page.items.map((p) => p.name)).toEqual(["Banking portal", "Clinic", "Shops app"]);
      expect(page.items.map((p) => p.environment.length)).toEqual([1, 0, 1]);
    });

    it("searches the name and the domain without regard to case, over all projects (AC-6 to AC-8)", async () => {
      await expect(names({ search: "BANKING" })).resolves.toEqual(["Banking portal", "Clinic"]);
      await expect(names({ search: "shops" })).resolves.toEqual(["Shops app"]);
      await expect(names({ search: "nothing" })).resolves.toEqual([]);
      await expect(names({ search: "" })).resolves.toHaveLength(3);
    });

    it.each([
      ["name", "ASC", ["Banking portal", "Clinic", "Shops app"]],
      ["name", "DESC", ["Shops app", "Clinic", "Banking portal"]],
      ["startDate", "ASC", ["Shops app", "Clinic", "Banking portal"]],
      ["startDate", "DESC", ["Banking portal", "Clinic", "Shops app"]],
      ["endDate", "ASC", ["Clinic", "Banking portal", "Shops app"]],
      ["endDate", "DESC", ["Shops app", "Banking portal", "Clinic"]],
    ])("sorts by %s %s (AC-9 to AC-12)", async (field, direction, expected) => {
      await expect(names({ sort: { field, direction } })).resolves.toEqual(expected);
    });

    it("sorts together with a search", async () => {
      await expect(
        names({ search: "banking", sort: { field: "endDate", direction: "DESC" } }),
      ).resolves.toEqual(["Banking portal", "Clinic"]);
    });

    it("pages the result and keeps the total of all matches", async () => {
      const { body } = await graphqlRequest(app, LIST, {
        cookies: admin,
        variables: { page: { number: 2, size: 2 } },
      });

      const page = (body.data as { projects: { items: { name: string }[]; total: number } })
        .projects;
      expect(page.items.map((p) => p.name)).toEqual(["Shops app"]);
      expect(page.total).toBe(3);
    });

    it("rejects a sort field that is not allowed", async () => {
      const { body } = await graphqlRequest(app, LIST, {
        cookies: admin,
        variables: { sort: { field: "description", direction: "ASC" } },
      });

      expect(body.errors?.[0]?.extensions.code).toBe("BAD_USER_INPUT");
    });
  });

  describe("updateProject", () => {
    it("changes the fields and replaces the environment (AC-28, AC-29)", async () => {
      const id = await createProject();

      const { body } = await graphqlRequest(app, UPDATE, {
        cookies: admin,
        variables: { input: { ...input({ name: "Intranet 2", environmentIds: [react] }), id } },
      });

      expect(body.errors).toBeUndefined();
      expect(body.data).toMatchObject({
        updateProject: { id, name: "Intranet 2", environment: [{ id: react, name: "React" }] },
      });
      await expect(prisma.projectSkill.findMany()).resolves.toEqual([
        { projectId: id, skillId: react },
      ]);
    });

    it("fails with NOT_FOUND for an unknown project", async () => {
      const { body } = await graphqlRequest(app, UPDATE, {
        cookies: admin,
        variables: { input: { ...input(), id: MISSING_ID } },
      });

      expect(body.errors?.[0]?.extensions.code).toBe("NOT_FOUND");
    });

    it("rejects an end date before the start date and a skill that does not exist", async () => {
      const id = await createProject();

      const dates = await graphqlRequest(app, UPDATE, {
        cookies: admin,
        variables: { input: { ...input({ startDate: "2026-07-01" }), id } },
      });
      const skills = await graphqlRequest(app, UPDATE, {
        cookies: admin,
        variables: { input: { ...input({ environmentIds: [MISSING_ID] }), id } },
      });

      expect(dates.body.errors?.[0]?.extensions.code).toBe("BAD_USER_INPUT");
      expect(skills.body.errors?.[0]?.extensions.code).toBe("BAD_USER_INPUT");
    });

    describe("dates used by CVs (D25)", () => {
      it("blocks a start date after the start of a CV entry, with the count", async () => {
        const id = await createProject();
        await addToCv(id, "2026-02-01", "2026-03-01");
        await addToCv(id, "2026-01-15", null);

        const { body } = await graphqlRequest(app, UPDATE, {
          cookies: admin,
          variables: { input: { ...input({ startDate: "2026-03-01" }), id } },
        });

        expect(body.errors?.[0]).toMatchObject({
          message: expect.stringContaining("2 CVs"),
          extensions: { code: "CONFLICT" },
        });
        await expect(prisma.project.findUniqueOrThrow({ where: { id } })).resolves.toMatchObject({
          startDate: new Date("2026-01-01"),
        });
      });

      it("blocks an end date before the end of a CV entry", async () => {
        const id = await createProject();
        await addToCv(id, "2026-02-01", "2026-06-01");

        const { body } = await graphqlRequest(app, UPDATE, {
          cookies: admin,
          variables: { input: { ...input({ endDate: "2026-05-31" }), id } },
        });

        expect(body.errors?.[0]).toMatchObject({
          message: expect.stringContaining("1 CV"),
          extensions: { code: "CONFLICT" },
        });
      });

      it("allows new dates that still cover every CV entry, and ignores a CV end date that is empty", async () => {
        const id = await createProject();
        await addToCv(id, "2026-02-01", "2026-03-01");
        await addToCv(id, "2026-02-15", null);

        const { body } = await graphqlRequest(app, UPDATE, {
          cookies: admin,
          variables: {
            input: { ...input({ startDate: "2026-02-01", endDate: "2026-03-01" }), id },
          },
        });

        expect(body.errors).toBeUndefined();
      });

      it("allows other changes while the dates stay the same", async () => {
        const id = await createProject();
        await addToCv(id, "2026-02-01", "2026-03-01");

        const { body } = await graphqlRequest(app, UPDATE, {
          cookies: admin,
          variables: { input: { ...input({ description: "New text" }), id } },
        });

        expect(body.errors).toBeUndefined();
      });
    });
  });

  describe("deleteProject", () => {
    it("deletes the project and its environment links (AC-32)", async () => {
      const id = await createProject();

      const { body } = await graphqlRequest(app, DELETE, { cookies: admin, variables: { id } });

      expect(body).toEqual({ data: { deleteProject: true } });
      await expect(prisma.project.count()).resolves.toBe(0);
      await expect(prisma.projectSkill.count()).resolves.toBe(0);
      await expect(prisma.skill.count()).resolves.toBe(2); // the skills stay
    });

    it("fails with CONFLICT and the count when CVs use the project (AC-33)", async () => {
      const id = await createProject();
      await addToCv(id, "2026-02-01", null);

      const { body } = await graphqlRequest(app, DELETE, { cookies: admin, variables: { id } });

      expect(body.errors?.[0]).toMatchObject({
        message: expect.stringContaining("1 CV"),
        extensions: { code: "CONFLICT" },
      });
      await expect(prisma.project.count()).resolves.toBe(1);
    });

    it("fails with NOT_FOUND for an unknown project", async () => {
      const { body } = await graphqlRequest(app, DELETE, {
        cookies: admin,
        variables: { id: MISSING_ID },
      });

      expect(body.errors?.[0]?.extensions.code).toBe("NOT_FOUND");
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

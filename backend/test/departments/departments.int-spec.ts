import { INestApplication } from "@nestjs/common";
import { Role } from "../../src/generated/prisma/enums";
import { PrismaService } from "../../src/prisma/prisma.service";
import { createTestApp } from "../support/create-test-app";
import { createUser, TEST_PASSWORD } from "../support/create-user";
import { graphqlRequest, toCookiePair } from "../support/graphql-request";

const SIGN_IN = `mutation ($input: SignInInput!) { signIn(input: $input) { id } }`;

const LIST = `query ($search: String, $sort: SortInput, $page: PageInput) {
  departments(search: $search, sort: $sort, page: $page) { items { id name } total }
}`;
const CREATE = `mutation ($input: CreateDepartmentInput!) { createDepartment(input: $input) { id name } }`;
const UPDATE = `mutation ($input: UpdateDepartmentInput!) { updateDepartment(input: $input) { id name } }`;
const DELETE = `mutation ($id: ID!) { deleteDepartment(id: $id) }`;

const MISSING_ID = "00000000-0000-4000-8000-000000000000";

describe("departments", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let admin: string[];
  let user: string[];

  async function signIn(email: string): Promise<string[]> {
    const { setCookies } = await graphqlRequest(app, SIGN_IN, {
      variables: { input: { email, password: TEST_PASSWORD } },
    });
    return setCookies.map(toCookiePair);
  }

  async function createDepartment(name: string): Promise<string> {
    const { body } = await graphqlRequest(app, CREATE, {
      cookies: admin,
      variables: { input: { name } },
    });
    expect(body.errors).toBeUndefined();
    return (body.data as { createDepartment: { id: string } }).createDepartment.id;
  }

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    await createUser(app, { email: "admin@example.com", role: Role.ADMIN });
    await createUser(app, { email: "user@example.com" });
    admin = await signIn("admin@example.com");
    user = await signIn("user@example.com");
  });

  beforeEach(async () => {
    await prisma.user.updateMany({ data: { departmentId: null } });
    await prisma.department.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("authorization", () => {
    const operations: [string, string, Record<string, unknown>][] = [
      ["departments", LIST, {}],
      ["createDepartment", CREATE, { input: { name: "Engineering" } }],
      ["updateDepartment", UPDATE, { input: { id: MISSING_ID, name: "Engineering" } }],
      ["deleteDepartment", DELETE, { id: MISSING_ID }],
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

    it("does not change data when a user who is not an admin tries to create a department", async () => {
      await graphqlRequest(app, CREATE, { cookies: user, variables: { input: { name: "Sales" } } });

      await expect(prisma.department.count()).resolves.toBe(0);
    });
  });

  describe("createDepartment", () => {
    it("creates a department, normalises the spaces, keeps the letter case and keeps it", async () => {
      const { body } = await graphqlRequest(app, CREATE, {
        cookies: admin,
        variables: { input: { name: "  Human   Resources  " } },
      });

      expect(body.errors).toBeUndefined();
      const created = (body.data as { createDepartment: { id: string; name: string } })
        .createDepartment;
      expect(created.name).toBe("Human Resources");
      await expect(
        prisma.department.findUniqueOrThrow({ where: { id: created.id } }),
      ).resolves.toMatchObject({ name: "Human Resources" });
    });

    it.each([
      ["an empty name", ""],
      ["a name of only spaces", "   "],
      ["a name longer than 100 characters", "a".repeat(101)],
    ])("rejects %s with a field error", async (_case, name) => {
      const { body } = await graphqlRequest(app, CREATE, {
        cookies: admin,
        variables: { input: { name } },
      });

      expect(body.errors?.[0]?.extensions).toMatchObject({
        code: "BAD_USER_INPUT",
        fieldErrors: [expect.objectContaining({ field: "name" })],
      });
      await expect(prisma.department.count()).resolves.toBe(0);
    });

    it("accepts a name of exactly 100 characters", async () => {
      await createDepartment("a".repeat(100));

      await expect(prisma.department.count()).resolves.toBe(1);
    });

    it.each([
      ["the same name", "Human Resources"],
      ["spaces around and inside", " Human   Resources "],
      ["other letter case", "HUMAN resources"],
    ])("fails with CONFLICT for a name that already exists, with %s (D35)", async (_case, name) => {
      await createDepartment("Human Resources");

      const { body } = await graphqlRequest(app, CREATE, {
        cookies: admin,
        variables: { input: { name } },
      });

      expect(body.errors?.[0]).toMatchObject({
        message: "Department already exists",
        extensions: { code: "CONFLICT" },
      });
      await expect(prisma.department.count()).resolves.toBe(1);
    });
  });

  describe("database rules (D35)", () => {
    it("refuses a name that differs only in letter case, even without the service", async () => {
      await prisma.department.create({ data: { name: "Engineering" } });

      await expect(prisma.department.create({ data: { name: "engineering" } })).rejects.toThrow();
    });

    it("refuses a name longer than 100 characters, even without the service", async () => {
      await expect(prisma.department.create({ data: { name: "a".repeat(101) } })).rejects.toThrow();
    });
  });

  describe("departments", () => {
    beforeEach(async () => {
      for (const name of ["Sales", "Engineering", "Design"]) {
        await createDepartment(name);
      }
    });

    async function names(variables: Record<string, unknown> = {}): Promise<string[]> {
      const { body } = await graphqlRequest(app, LIST, { cookies: admin, variables });
      expect(body.errors).toBeUndefined();
      return (body.data as { departments: { items: { name: string }[] } }).departments.items.map(
        (d) => d.name,
      );
    }

    it("lists the departments with the total, sorted by name by default", async () => {
      const { body } = await graphqlRequest(app, LIST, { cookies: admin });

      const page = (body.data as { departments: { items: { name: string }[]; total: number } })
        .departments;
      expect(page.items.map((d) => d.name)).toEqual(["Design", "Engineering", "Sales"]);
      expect(page.total).toBe(3);
    });

    it("sorts by name descending", async () => {
      await expect(names({ sort: { field: "name", direction: "DESC" } })).resolves.toEqual([
        "Sales",
        "Engineering",
        "Design",
      ]);
    });

    it("sorts without regard to letter case (D35)", async () => {
      await createDepartment("analytics");

      await expect(names()).resolves.toEqual(["analytics", "Design", "Engineering", "Sales"]);
    });

    it("searches the name without regard to case", async () => {
      await expect(names({ search: "ENG" })).resolves.toEqual(["Engineering"]);
    });

    it("pages the result and keeps the total of all matches", async () => {
      const { body } = await graphqlRequest(app, LIST, {
        cookies: admin,
        variables: { page: { number: 2, size: 2 } },
      });

      const page = (body.data as { departments: { items: { name: string }[]; total: number } })
        .departments;
      expect(page.items.map((d) => d.name)).toEqual(["Sales"]);
      expect(page.total).toBe(3);
    });

    it("rejects a sort field that is not allowed", async () => {
      const { body } = await graphqlRequest(app, LIST, {
        cookies: admin,
        variables: { sort: { field: "createdAt", direction: "ASC" } },
      });

      expect(body.errors?.[0]?.extensions.code).toBe("BAD_USER_INPUT");
    });
  });

  describe("updateDepartment", () => {
    it("renames the department and trims the name", async () => {
      const id = await createDepartment("Engineering");

      const { body } = await graphqlRequest(app, UPDATE, {
        cookies: admin,
        variables: { input: { id, name: " Platform " } },
      });

      expect(body).toEqual({ data: { updateDepartment: { id, name: "Platform" } } });
    });

    it("allows saving the same name again", async () => {
      const id = await createDepartment("Engineering");

      const { body } = await graphqlRequest(app, UPDATE, {
        cookies: admin,
        variables: { input: { id, name: "Engineering" } },
      });

      expect(body.errors).toBeUndefined();
    });

    it("allows changing only the letter case of its own name", async () => {
      const id = await createDepartment("Engineering");

      const { body } = await graphqlRequest(app, UPDATE, {
        cookies: admin,
        variables: { input: { id, name: "ENGINEERING" } },
      });

      expect(body).toEqual({ data: { updateDepartment: { id, name: "ENGINEERING" } } });
    });

    it("fails with CONFLICT for the name of another department, in any letter case", async () => {
      await createDepartment("Sales");
      const id = await createDepartment("Engineering");

      const { body } = await graphqlRequest(app, UPDATE, {
        cookies: admin,
        variables: { input: { id, name: "sALES" } },
      });

      expect(body.errors?.[0]).toMatchObject({
        message: "Department already exists",
        extensions: { code: "CONFLICT" },
      });
      await expect(prisma.department.findUniqueOrThrow({ where: { id } })).resolves.toMatchObject({
        name: "Engineering",
      });
    });

    it("fails with NOT_FOUND for an unknown department", async () => {
      const { body } = await graphqlRequest(app, UPDATE, {
        cookies: admin,
        variables: { input: { id: MISSING_ID, name: "Sales" } },
      });

      expect(body.errors?.[0]?.extensions.code).toBe("NOT_FOUND");
    });

    it("rejects an id that is not a UUID with a field error", async () => {
      const { body } = await graphqlRequest(app, UPDATE, {
        cookies: admin,
        variables: { input: { id: "1", name: "Sales" } },
      });

      expect(body.errors?.[0]?.extensions).toMatchObject({
        code: "BAD_USER_INPUT",
        fieldErrors: [expect.objectContaining({ field: "id" })],
      });
    });
  });

  describe("deleteDepartment", () => {
    it("deletes the department", async () => {
      const id = await createDepartment("Engineering");

      const { body } = await graphqlRequest(app, DELETE, { cookies: admin, variables: { id } });

      expect(body).toEqual({ data: { deleteDepartment: true } });
      await expect(prisma.department.count()).resolves.toBe(0);
    });

    it("fails with CONFLICT when a user still has the department, and keeps it", async () => {
      const id = await createDepartment("Engineering");
      await prisma.user.update({
        where: { email: "user@example.com" },
        data: { departmentId: id },
      });

      const { body } = await graphqlRequest(app, DELETE, { cookies: admin, variables: { id } });

      expect(body.errors?.[0]).toMatchObject({
        message: "Department cannot be deleted because it is currently in use",
        extensions: { code: "CONFLICT" },
      });
      await expect(prisma.department.count()).resolves.toBe(1);
    });

    it("fails with NOT_FOUND for an unknown department", async () => {
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

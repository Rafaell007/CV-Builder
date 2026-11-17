import { INestApplication } from "@nestjs/common";
import { Role } from "../../src/generated/prisma/enums";
import { PrismaService } from "../../src/prisma/prisma.service";
import { createTestApp } from "../support/create-test-app";
import { createUser, TEST_PASSWORD } from "../support/create-user";
import { graphqlRequest, toCookiePair } from "../support/graphql-request";

const SIGN_IN = `mutation ($input: SignInInput!) { signIn(input: $input) { id } }`;

const LIST = `query ($search: String, $sort: SortInput, $page: PageInput) {
  positions(search: $search, sort: $sort, page: $page) { items { id name } total }
}`;
const CREATE = `mutation ($input: CreatePositionInput!) { createPosition(input: $input) { id name } }`;
const UPDATE = `mutation ($input: UpdatePositionInput!) { updatePosition(input: $input) { id name } }`;
const DELETE = `mutation ($id: ID!) { deletePosition(id: $id) }`;

const MISSING_ID = "00000000-0000-4000-8000-000000000000";

describe("positions", () => {
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

  async function createPosition(name: string): Promise<string> {
    const { body } = await graphqlRequest(app, CREATE, {
      cookies: admin,
      variables: { input: { name } },
    });
    expect(body.errors).toBeUndefined();
    return (body.data as { createPosition: { id: string } }).createPosition.id;
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
    await prisma.user.updateMany({ data: { positionId: null } });
    await prisma.position.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("authorization", () => {
    const operations: [string, string, Record<string, unknown>][] = [
      ["positions", LIST, {}],
      ["createPosition", CREATE, { input: { name: "Developer" } }],
      ["updatePosition", UPDATE, { input: { id: MISSING_ID, name: "Developer" } }],
      ["deletePosition", DELETE, { id: MISSING_ID }],
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

    it("does not change data when a user who is not an admin tries to create a position", async () => {
      await graphqlRequest(app, CREATE, {
        cookies: user,
        variables: { input: { name: "Tester" } },
      });

      await expect(prisma.position.count()).resolves.toBe(0);
    });
  });

  describe("createPosition", () => {
    it("creates a position, normalises the spaces, keeps the letter case and keeps it", async () => {
      const { body } = await graphqlRequest(app, CREATE, {
        cookies: admin,
        variables: { input: { name: "  Team   lead  " } },
      });

      expect(body.errors).toBeUndefined();
      const created = (body.data as { createPosition: { id: string; name: string } })
        .createPosition;
      expect(created.name).toBe("Team lead");
      await expect(
        prisma.position.findUniqueOrThrow({ where: { id: created.id } }),
      ).resolves.toMatchObject({ name: "Team lead" });
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
      await expect(prisma.position.count()).resolves.toBe(0);
    });

    it("accepts a name of exactly 100 characters", async () => {
      await createPosition("a".repeat(100));

      await expect(prisma.position.count()).resolves.toBe(1);
    });

    it.each([
      ["the same name", "Team lead"],
      ["spaces around and inside", " Team   lead "],
      ["other letter case", "TEAM lead"],
    ])("fails with CONFLICT for a name that already exists, with %s (D35)", async (_case, name) => {
      await createPosition("Team lead");

      const { body } = await graphqlRequest(app, CREATE, {
        cookies: admin,
        variables: { input: { name } },
      });

      expect(body.errors?.[0]).toMatchObject({
        message: "Position already exists",
        extensions: { code: "CONFLICT" },
      });
      await expect(prisma.position.count()).resolves.toBe(1);
    });
  });

  describe("database rules (D35)", () => {
    it("refuses a name that differs only in letter case, even without the service", async () => {
      await prisma.position.create({ data: { name: "Developer" } });

      await expect(prisma.position.create({ data: { name: "developer" } })).rejects.toThrow();
    });

    it("refuses a name longer than 100 characters, even without the service", async () => {
      await expect(prisma.position.create({ data: { name: "a".repeat(101) } })).rejects.toThrow();
    });
  });

  describe("positions", () => {
    beforeEach(async () => {
      for (const name of ["Tester", "Developer", "Architect"]) {
        await createPosition(name);
      }
    });

    async function names(variables: Record<string, unknown> = {}): Promise<string[]> {
      const { body } = await graphqlRequest(app, LIST, { cookies: admin, variables });
      expect(body.errors).toBeUndefined();
      return (body.data as { positions: { items: { name: string }[] } }).positions.items.map(
        (p) => p.name,
      );
    }

    it("lists the positions with the total, sorted by name by default", async () => {
      const { body } = await graphqlRequest(app, LIST, { cookies: admin });

      const page = (body.data as { positions: { items: { name: string }[]; total: number } })
        .positions;
      expect(page.items.map((p) => p.name)).toEqual(["Architect", "Developer", "Tester"]);
      expect(page.total).toBe(3);
    });

    it("sorts by name descending", async () => {
      await expect(names({ sort: { field: "name", direction: "DESC" } })).resolves.toEqual([
        "Tester",
        "Developer",
        "Architect",
      ]);
    });

    it("sorts without regard to letter case (D35)", async () => {
      await createPosition("accountant");

      await expect(names()).resolves.toEqual(["accountant", "Architect", "Developer", "Tester"]);
    });

    it("searches the name without regard to case", async () => {
      await expect(names({ search: "DEV" })).resolves.toEqual(["Developer"]);
    });

    it("pages the result and keeps the total of all matches", async () => {
      const { body } = await graphqlRequest(app, LIST, {
        cookies: admin,
        variables: { page: { number: 2, size: 2 } },
      });

      const page = (body.data as { positions: { items: { name: string }[]; total: number } })
        .positions;
      expect(page.items.map((p) => p.name)).toEqual(["Tester"]);
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

  describe("updatePosition", () => {
    it("renames the position and trims the name", async () => {
      const id = await createPosition("Developer");

      const { body } = await graphqlRequest(app, UPDATE, {
        cookies: admin,
        variables: { input: { id, name: " Scrum master " } },
      });

      expect(body).toEqual({ data: { updatePosition: { id, name: "Scrum master" } } });
    });

    it("allows saving the same name again", async () => {
      const id = await createPosition("Developer");

      const { body } = await graphqlRequest(app, UPDATE, {
        cookies: admin,
        variables: { input: { id, name: "Developer" } },
      });

      expect(body.errors).toBeUndefined();
    });

    it("allows changing only the letter case of its own name", async () => {
      const id = await createPosition("Developer");

      const { body } = await graphqlRequest(app, UPDATE, {
        cookies: admin,
        variables: { input: { id, name: "DEVELOPER" } },
      });

      expect(body).toEqual({ data: { updatePosition: { id, name: "DEVELOPER" } } });
    });

    it("fails with CONFLICT for the name of another position, in any letter case", async () => {
      await createPosition("Tester");
      const id = await createPosition("Developer");

      const { body } = await graphqlRequest(app, UPDATE, {
        cookies: admin,
        variables: { input: { id, name: "tESTER" } },
      });

      expect(body.errors?.[0]).toMatchObject({
        message: "Position already exists",
        extensions: { code: "CONFLICT" },
      });
      await expect(prisma.position.findUniqueOrThrow({ where: { id } })).resolves.toMatchObject({
        name: "Developer",
      });
    });

    it("fails with NOT_FOUND for an unknown position", async () => {
      const { body } = await graphqlRequest(app, UPDATE, {
        cookies: admin,
        variables: { input: { id: MISSING_ID, name: "Tester" } },
      });

      expect(body.errors?.[0]?.extensions.code).toBe("NOT_FOUND");
    });

    it("rejects an id that is not a UUID with a field error", async () => {
      const { body } = await graphqlRequest(app, UPDATE, {
        cookies: admin,
        variables: { input: { id: "1", name: "Tester" } },
      });

      expect(body.errors?.[0]?.extensions).toMatchObject({
        code: "BAD_USER_INPUT",
        fieldErrors: [expect.objectContaining({ field: "id" })],
      });
    });
  });

  describe("deletePosition", () => {
    it("deletes the position", async () => {
      const id = await createPosition("Developer");

      const { body } = await graphqlRequest(app, DELETE, { cookies: admin, variables: { id } });

      expect(body).toEqual({ data: { deletePosition: true } });
      await expect(prisma.position.count()).resolves.toBe(0);
    });

    it("fails with CONFLICT when a user still has the position, and keeps it", async () => {
      const id = await createPosition("Developer");
      await prisma.user.update({
        where: { email: "user@example.com" },
        data: { positionId: id },
      });

      const { body } = await graphqlRequest(app, DELETE, { cookies: admin, variables: { id } });

      expect(body.errors?.[0]).toMatchObject({
        message: "Position cannot be deleted because it is currently in use",
        extensions: { code: "CONFLICT" },
      });
      await expect(prisma.position.count()).resolves.toBe(1);
    });

    it("fails with NOT_FOUND for an unknown position", async () => {
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

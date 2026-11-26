import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { Role } from "../../src/generated/prisma/enums";
import { PrismaService } from "../../src/prisma/prisma.service";
import { createTestApp } from "../support/create-test-app";
import { createUser, TEST_PASSWORD } from "../support/create-user";
import { graphqlRequest, toCookiePair } from "../support/graphql-request";
import type { GraphQLBody } from "../support/graphql-request";

const SIGN_IN = `mutation ($input: SignInInput!) { signIn(input: $input) { id } }`;

const FIELDS = "id email firstName lastName role department { id name } position { id name }";
const LIST = `query ($search: String, $sort: SortInput, $page: PageInput) {
  users(search: $search, sort: $sort, page: $page) { items { ${FIELDS} } total }
}`;
const USER = `query ($id: ID!) { user(id: $id) { ${FIELDS} } }`;
const CREATE = `mutation ($input: CreateUserInput!) { createUser(input: $input) { ${FIELDS} } }`;
const UPDATE = `mutation ($input: UpdateUserInput!) { updateUser(input: $input) { ${FIELDS} } }`;
const UPDATE_PROFILE = `mutation ($input: UpdateProfileInput!) { updateProfile(input: $input) { ${FIELDS} } }`;
const DELETE = `mutation ($id: ID!) { deleteUser(id: $id) }`;

/** A password that passes D33 (8–128 characters, a letter and a digit). */
const NEW_PASSWORD = "Secret123";

const MISSING_ID = "00000000-0000-4000-8000-000000000000";
const ADMIN_EMAIL = "admin@example.com";
const USER_EMAIL = "user@example.com";

interface UserRow {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  department: { id: string; name: string } | null;
  position: { id: string; name: string } | null;
}

interface UserPage {
  items: UserRow[];
  total: number;
}

describe("users", () => {
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

  /** `users` as the admin; fails the test on a GraphQL error. */
  async function listUsers(variables: Record<string, unknown> = {}): Promise<UserPage> {
    const { body } = await graphqlRequest(app, LIST, { cookies: admin, variables });
    expect(body.errors).toBeUndefined();
    return (body.data as { users: UserPage }).users;
  }

  /** The emails of a page, in the order the API returned them. */
  const emails = (page: UserPage): string[] => page.items.map((item) => item.email);

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    await createUser(app, { email: ADMIN_EMAIL, role: Role.ADMIN });
    await createUser(app, { email: USER_EMAIL });
    admin = await signIn(ADMIN_EMAIL);
    user = await signIn(USER_EMAIL);
  });

  afterAll(async () => {
    await app.close();
  });

  describe("reading", () => {
    // Three users with a full profile, each in another department and position, so every sort
    // gives one clear order. The admin and the user above have no name, department or position.
    const ALPHA = "alpha.lima@example.com";
    const BRAVO = "bravo.tango@example.com";
    const CHARLIE = "charlie.kilo@example.com";
    const NO_PROFILE = [ADMIN_EMAIL, USER_EMAIL].sort();
    let alphaId: string;

    beforeAll(async () => {
      const [engineering, marketing, sales] = await Promise.all(
        ["Engineering", "Marketing", "Sales"].map((name) =>
          prisma.department.create({ data: { name } }),
        ),
      );
      const [developer, manager, tester] = await Promise.all(
        ["Developer", "Manager", "Tester"].map((name) =>
          prisma.position.create({ data: { name } }),
        ),
      );
      const profile = (
        email: string,
        firstName: string,
        lastName: string,
        departmentId: string,
        positionId: string,
      ) =>
        prisma.user.create({
          data: {
            email,
            passwordHash: "not-a-real-hash",
            firstName,
            lastName,
            departmentId,
            positionId,
          },
          select: { id: true },
        });
      ({ id: alphaId } = await profile(ALPHA, "Alpha", "Lima", sales!.id, tester!.id));
      await profile(BRAVO, "Bravo", "Tango", engineering!.id, manager!.id);
      await profile(CHARLIE, "Charlie", "Kilo", marketing!.id, developer!.id);
    });

    afterAll(async () => {
      await prisma.user.deleteMany({ where: { email: { in: [ALPHA, BRAVO, CHARLIE] } } });
      await prisma.department.deleteMany();
      await prisma.position.deleteMany();
    });

    describe("authorization", () => {
      it.each([
        ["users", LIST, {}],
        ["user", USER, { id: MISSING_ID }],
      ])("%s refuses a visitor who is not signed in", async (_name, query, variables) => {
        const { body } = await graphqlRequest(app, query, { variables });

        expect(body.errors?.[0]?.extensions.code).toBe("UNAUTHENTICATED");
      });

      it("lets a user who is not an admin read the list and one user (AC-1, AC-20)", async () => {
        const list = await graphqlRequest(app, LIST, { cookies: user });
        const one = await graphqlRequest(app, USER, { cookies: user, variables: { id: alphaId } });

        expect(list.body.errors).toBeUndefined();
        expect((list.body.data as { users: UserPage }).users.total).toBe(5);
        expect(one.body.errors).toBeUndefined();
      });

      it("lets a user with an unverified email read the list (D16 does not cover it)", async () => {
        await createUser(app, { email: "unverified@example.com", isVerified: false });
        const cookies = await signIn("unverified@example.com");

        const { body } = await graphqlRequest(app, LIST, { cookies });

        expect(body.errors).toBeUndefined();
        await prisma.user.delete({ where: { email: "unverified@example.com" } });
      });

      it("has no field for the password hash, so no query can read it (AC-18, AC-26)", async () => {
        // GraphQL refuses an unknown field before any resolver runs, with HTTP 400,
        // so this request goes without graphqlRequest (it expects 200).
        const response = await request(app.getHttpServer())
          .post("/graphql")
          .set("Cookie", admin.join("; "))
          .send({ query: `{ users { items { passwordHash } } }` })
          .expect(400);

        expect((response.body as GraphQLBody).errors?.[0]?.extensions.code).toBe(
          "GRAPHQL_VALIDATION_FAILED",
        );
      });
    });

    describe("users", () => {
      it("returns every user with the department and position, and the total (AC-3, AC-4)", async () => {
        const page = await listUsers();

        expect(page.total).toBe(5);
        expect(page.items.find((item) => item.email === ALPHA)).toEqual({
          id: alphaId,
          email: ALPHA,
          firstName: "Alpha",
          lastName: "Lima",
          role: Role.USER,
          department: { id: expect.any(String) as string, name: "Sales" },
          position: { id: expect.any(String) as string, name: "Tester" },
        });
        expect(page.items.find((item) => item.email === USER_EMAIL)).toMatchObject({
          firstName: null,
          lastName: null,
          department: null,
          position: null,
        });
      });

      it("sorts by first name A→Z when no sort is given; users without a name come last", async () => {
        const page = await listUsers();

        expect(emails(page).slice(0, 3)).toEqual([ALPHA, BRAVO, CHARLIE]);
        expect(emails(page).slice(3).sort()).toEqual(NO_PROFILE);
      });

      it.each([
        ["firstName", "DESC", [CHARLIE, BRAVO, ALPHA]],
        ["lastName", "ASC", [CHARLIE, ALPHA, BRAVO]],
        ["lastName", "DESC", [BRAVO, ALPHA, CHARLIE]],
        ["department", "ASC", [BRAVO, CHARLIE, ALPHA]],
        ["department", "DESC", [ALPHA, CHARLIE, BRAVO]],
        ["position", "ASC", [CHARLIE, BRAVO, ALPHA]],
        ["position", "DESC", [ALPHA, BRAVO, CHARLIE]],
      ])("sorts by %s %s (AC-7, AC-8)", async (field, direction, expected) => {
        const page = await listUsers({ sort: { field, direction } });
        const order = emails(page);

        // Empty values follow PostgreSQL: last in A→Z, first in Z→A.
        if (direction === "ASC") {
          expect(order.slice(0, 3)).toEqual(expected);
          expect(order.slice(3).sort()).toEqual(NO_PROFILE);
        } else {
          expect(order.slice(0, 2).sort()).toEqual(NO_PROFILE);
          expect(order.slice(2)).toEqual(expected);
        }
      });

      it.each(["email", "passwordHash", "role"])(
        "refuses the sort field %j with BAD_USER_INPUT",
        async (field) => {
          const { body } = await graphqlRequest(app, LIST, {
            cookies: admin,
            variables: { sort: { field, direction: "ASC" } },
          });

          expect(body.errors?.[0]?.extensions.code).toBe("BAD_USER_INPUT");
        },
      );

      it.each([
        ["a first name, in any letter case", "aLpHa", [ALPHA]],
        ["a last name", "kilo", [CHARLIE]],
        ["a part of the email", "tango@", [BRAVO]],
        ["a full name, word by word", "  bravo   TAN ", [BRAVO]],
        ["words from different fields", "charlie marketing", []],
        ["% as a plain character", "%", []],
        ["_ as a plain character", "_", []],
      ])("searches %s (AC-5, AC-6)", async (_case, search, expected) => {
        const page = await listUsers({ search });

        expect(emails(page)).toEqual(expected);
        expect(page.total).toBe(expected.length);
      });

      it("searches, sorts and pages together (AC-9, AC-10)", async () => {
        const first = await listUsers({
          search: "example.com",
          sort: { field: "lastName", direction: "ASC" },
          page: { number: 1, size: 2 },
        });
        const second = await listUsers({
          search: "example.com",
          sort: { field: "lastName", direction: "ASC" },
          page: { number: 2, size: 2 },
        });

        expect(emails(first)).toEqual([CHARLIE, ALPHA]);
        expect(emails(second)[0]).toBe(BRAVO);
        expect(first.total).toBe(5);
        expect(second.total).toBe(5);
      });
    });

    describe("user", () => {
      it("returns one user with the department and position", async () => {
        const { body } = await graphqlRequest(app, USER, {
          cookies: admin,
          variables: { id: alphaId },
        });

        expect(body.errors).toBeUndefined();
        expect((body.data as { user: UserRow }).user).toMatchObject({
          id: alphaId,
          email: ALPHA,
          department: { name: "Sales" },
          position: { name: "Tester" },
        });
      });

      it("returns when the account was created, as an ISO date (Member since, profile AC-14)", async () => {
        const { createdAt } = await prisma.user.findUniqueOrThrow({
          where: { id: alphaId },
          select: { createdAt: true },
        });

        const { body } = await graphqlRequest(
          app,
          `query ($id: ID!) { user(id: $id) { createdAt } }`,
          {
            cookies: admin,
            variables: { id: alphaId },
          },
        );

        expect(body.errors).toBeUndefined();
        expect((body.data as { user: { createdAt: string } }).user.createdAt).toBe(
          createdAt.toISOString(),
        );
      });

      it("fails with NOT_FOUND for an unknown id", async () => {
        const { body } = await graphqlRequest(app, USER, {
          cookies: admin,
          variables: { id: MISSING_ID },
        });

        expect(body.errors?.[0]).toMatchObject({
          message: "User not found",
          extensions: { code: "NOT_FOUND" },
        });
      });

      it("fails with BAD_USER_INPUT for an id that is not a UUID", async () => {
        const { body } = await graphqlRequest(app, USER, {
          cookies: admin,
          variables: { id: "not-a-uuid" },
        });

        expect(body.errors?.[0]?.extensions.code).toBe("BAD_USER_INPUT");
      });
    });
  });

  describe("createUser and updateUser", () => {
    const NEW_EMAIL = "new.user@example.com";
    let departmentId: string;
    let otherDepartmentId: string;
    let positionId: string;
    let otherPositionId: string;
    let adminId: string;

    /** The fields that create and update share. */
    const profileInput = () => ({
      firstName: "New",
      lastName: "User",
      departmentId,
      positionId,
      role: Role.USER,
    });

    /** A valid create input; `overrides` changes single fields. */
    const createInput = (overrides: Record<string, unknown> = {}) => ({
      email: NEW_EMAIL,
      password: NEW_PASSWORD,
      ...profileInput(),
      ...overrides,
    });

    /** A valid update input for the user `id` (no email, no password). */
    const updateInput = (id: string, overrides: Record<string, unknown> = {}) => ({
      id,
      ...profileInput(),
      ...overrides,
    });

    /** `createUser` as the admin; fails the test on a GraphQL error. */
    async function createAsAdmin(overrides: Record<string, unknown> = {}): Promise<UserRow> {
      const { body } = await graphqlRequest(app, CREATE, {
        cookies: admin,
        variables: { input: createInput(overrides) },
      });
      expect(body.errors).toBeUndefined();
      return (body.data as { createUser: UserRow }).createUser;
    }

    /** The users this block made; the admin and the user of the whole file stay. */
    const countOthers = () =>
      prisma.user.count({ where: { email: { notIn: [ADMIN_EMAIL, USER_EMAIL] } } });

    beforeAll(async () => {
      [departmentId, otherDepartmentId] = (
        await Promise.all(
          ["Engineering", "Sales"].map((name) => prisma.department.create({ data: { name } })),
        )
      ).map(({ id }) => id) as [string, string];
      [positionId, otherPositionId] = (
        await Promise.all(
          ["Developer", "Manager"].map((name) => prisma.position.create({ data: { name } })),
        )
      ).map(({ id }) => id) as [string, string];
      adminId = (await prisma.user.findUniqueOrThrow({ where: { email: ADMIN_EMAIL } })).id;
    });

    afterEach(async () => {
      await prisma.user.deleteMany({ where: { email: { notIn: [ADMIN_EMAIL, USER_EMAIL] } } });
      // A test may change the admin's profile; the next test starts from no profile again.
      await prisma.user.update({
        where: { id: adminId },
        data: {
          role: Role.ADMIN,
          firstName: null,
          lastName: null,
          departmentId: null,
          positionId: null,
        },
      });
    });

    afterAll(async () => {
      await prisma.department.deleteMany();
      await prisma.position.deleteMany();
    });

    describe("authorization", () => {
      it.each([
        ["createUser", CREATE, () => ({ input: createInput() })],
        ["updateUser", UPDATE, () => ({ input: updateInput(MISSING_ID) })],
      ])("%s refuses a visitor who is not signed in", async (_name, query, variables) => {
        const { body } = await graphqlRequest(app, query, { variables: variables() });

        expect(body.errors?.[0]?.extensions.code).toBe("UNAUTHENTICATED");
      });

      it("createUser refuses a user who is not an admin and saves nothing (AC-12, AC-21)", async () => {
        const { body } = await graphqlRequest(app, CREATE, {
          cookies: user,
          variables: { input: createInput() },
        });

        expect(body.errors?.[0]?.extensions.code).toBe("FORBIDDEN");
        await expect(countOthers()).resolves.toBe(0);
      });

      it("updateUser refuses a user who is not an admin and changes nothing (AC-21)", async () => {
        const created = await createAsAdmin();

        const { body } = await graphqlRequest(app, UPDATE, {
          cookies: user,
          variables: { input: updateInput(created.id, { firstName: "Changed" }) },
        });

        expect(body.errors?.[0]?.extensions.code).toBe("FORBIDDEN");
        await expect(
          prisma.user.findUniqueOrThrow({ where: { id: created.id } }),
        ).resolves.toMatchObject({ firstName: "New" });
      });
    });

    describe("createUser", () => {
      it("creates a verified user with the profile and only a hash of the password (AC-14, AC-17, D16)", async () => {
        const created = await createAsAdmin({
          email: "  New.User@Example.COM ",
          firstName: " New ",
          lastName: " User ",
        });

        expect(created).toEqual({
          id: expect.any(String) as string,
          email: NEW_EMAIL,
          firstName: "New",
          lastName: "User",
          role: Role.USER,
          department: { id: departmentId, name: "Engineering" },
          position: { id: positionId, name: "Developer" },
        });
        const saved = await prisma.user.findUniqueOrThrow({ where: { id: created.id } });
        expect(saved.isVerified).toBe(true);
        expect(saved.passwordHash).not.toContain(NEW_PASSWORD);
        expect(saved.passwordHash.startsWith("$argon2id$")).toBe(true);
      });

      it("creates a user who can sign in with the password, in any letter case of the email", async () => {
        await createAsAdmin();

        const { body } = await graphqlRequest(app, SIGN_IN, {
          variables: { input: { email: "NEW.USER@example.com", password: NEW_PASSWORD } },
        });

        expect(body.errors).toBeUndefined();
      });

      it("creates an admin", async () => {
        await expect(createAsAdmin({ role: Role.ADMIN })).resolves.toMatchObject({
          role: Role.ADMIN,
        });
      });

      it.each([
        ["email", "an empty email", { email: "" }],
        ["email", "an email without @", { email: "new.user.example.com" }],
        [
          "email",
          "an email longer than 255 characters",
          { email: `${"a".repeat(250)}@example.com` },
        ],
        [
          "password",
          "a password of 6 characters (the doc's minimum, below D33)",
          { password: "abc123" },
        ],
        ["password", "a password without a digit", { password: "onlyletters" }],
        ["password", "a password without a letter", { password: "12345678" }],
        ["password", "a password longer than 128 characters", { password: `a1${"b".repeat(127)}` }],
        ["firstName", "an empty first name", { firstName: "" }],
        ["firstName", "a first name of only spaces", { firstName: "   " }],
        ["lastName", "a last name longer than 100 characters", { lastName: "a".repeat(101) }],
        ["departmentId", "a department id that is not a UUID", { departmentId: "engineering" }],
        ["positionId", "a position id that is not a UUID", { positionId: "" }],
      ])(
        "rejects %s: %s, with a field error and saves nothing (AC-15, AC-16)",
        async (field, _case, overrides) => {
          const { body } = await graphqlRequest(app, CREATE, {
            cookies: admin,
            variables: { input: createInput(overrides) },
          });

          expect(body.errors?.[0]?.extensions).toMatchObject({
            code: "BAD_USER_INPUT",
            fieldErrors: [expect.objectContaining({ field })],
          });
          await expect(countOthers()).resolves.toBe(0);
        },
      );

      it("accepts names of 100 characters and a password of 8", async () => {
        await createAsAdmin({
          firstName: "a".repeat(100),
          lastName: "b".repeat(100),
          password: "abcdefg1",
        });

        await expect(countOthers()).resolves.toBe(1);
      });

      it("refuses a role that does not exist, before any resolver runs", async () => {
        // An unknown enum value fails while GraphQL reads the variables, with HTTP 400,
        // so this request goes without graphqlRequest (it expects 200).
        const response = await request(app.getHttpServer())
          .post("/graphql")
          .set("Cookie", admin.join("; "))
          .send({ query: CREATE, variables: { input: createInput({ role: "OWNER" }) } })
          .expect(400);

        expect((response.body as GraphQLBody).errors?.[0]?.extensions.code).toBe("BAD_USER_INPUT");
        await expect(countOthers()).resolves.toBe(0);
      });

      it("names both a missing department and a missing position", async () => {
        const { body } = await graphqlRequest(app, CREATE, {
          cookies: admin,
          variables: { input: createInput({ departmentId: MISSING_ID, positionId: MISSING_ID }) },
        });

        expect(body.errors?.[0]?.extensions).toEqual({
          code: "BAD_USER_INPUT",
          fieldErrors: [
            { field: "departmentId", messages: ["Department not found"] },
            { field: "positionId", messages: ["Position not found"] },
          ],
        });
        await expect(countOthers()).resolves.toBe(0);
      });

      it.each([
        ["a user the admin created", NEW_EMAIL, "NEW.USER@EXAMPLE.COM"],
        ["a user who signed up", USER_EMAIL, " User@Example.com "],
      ])(
        "fails with CONFLICT and reason EMAIL_TAKEN for the email of %s, in another letter case (AC-19)",
        async (_case, existing, email) => {
          if (existing === NEW_EMAIL) await createAsAdmin();

          const { body } = await graphqlRequest(app, CREATE, {
            cookies: admin,
            variables: { input: createInput({ email }) },
          });

          expect(body.errors?.[0]?.extensions).toMatchObject({
            code: "CONFLICT",
            reason: "EMAIL_TAKEN",
          });
        },
      );
    });

    describe("updateUser", () => {
      it("changes the names, department, position and role, and saves them (AC-27, AC-28)", async () => {
        const created = await createAsAdmin();
        const before = await prisma.user.findUniqueOrThrow({ where: { id: created.id } });

        const { body } = await graphqlRequest(app, UPDATE, {
          cookies: admin,
          variables: {
            input: updateInput(created.id, {
              firstName: " Renamed ",
              lastName: "Person",
              departmentId: otherDepartmentId,
              positionId: otherPositionId,
              role: Role.ADMIN,
            }),
          },
        });

        expect(body.errors).toBeUndefined();
        const expected = {
          firstName: "Renamed",
          lastName: "Person",
          role: Role.ADMIN,
          department: { id: otherDepartmentId, name: "Sales" },
          position: { id: otherPositionId, name: "Manager" },
        };
        expect((body.data as { updateUser: UserRow }).updateUser).toMatchObject(expected);
        const saved = await prisma.user.findUniqueOrThrow({ where: { id: created.id } });
        expect(saved).toMatchObject({
          firstName: "Renamed",
          lastName: "Person",
          role: Role.ADMIN,
          departmentId: otherDepartmentId,
          positionId: otherPositionId,
          // Not part of the input, so unchanged (AC-25).
          email: before.email,
          passwordHash: before.passwordHash,
        });
      });

      it("has no email or password in its input (AC-25)", async () => {
        const created = await createAsAdmin();

        const response = await request(app.getHttpServer())
          .post("/graphql")
          .set("Cookie", admin.join("; "))
          .send({
            query: UPDATE,
            variables: { input: { ...updateInput(created.id), email: "other@example.com" } },
          })
          .expect(400);

        expect((response.body as GraphQLBody).errors?.[0]?.extensions.code).toBe("BAD_USER_INPUT");
      });

      it.each([
        ["firstName", "an empty first name", { firstName: " " }],
        ["lastName", "a last name longer than 100 characters", { lastName: "a".repeat(101) }],
        ["departmentId", "a missing department", { departmentId: MISSING_ID }],
        ["positionId", "a missing position", { positionId: MISSING_ID }],
      ])(
        "rejects %s: %s, with a field error and changes nothing",
        async (field, _case, overrides) => {
          const created = await createAsAdmin();

          const { body } = await graphqlRequest(app, UPDATE, {
            cookies: admin,
            variables: { input: updateInput(created.id, overrides) },
          });

          expect(body.errors?.[0]?.extensions).toMatchObject({
            code: "BAD_USER_INPUT",
            fieldErrors: [expect.objectContaining({ field })],
          });
          await expect(
            prisma.user.findUniqueOrThrow({ where: { id: created.id } }),
          ).resolves.toMatchObject({
            firstName: "New",
            lastName: "User",
            departmentId,
            positionId,
          });
        },
      );

      it("finds the user when the id comes in upper case", async () => {
        const created = await createAsAdmin();

        const { body } = await graphqlRequest(app, UPDATE, {
          cookies: admin,
          variables: { input: updateInput(created.id.toUpperCase(), { firstName: "Upper" }) },
        });

        expect(body.errors).toBeUndefined();
        expect((body.data as { updateUser: UserRow }).updateUser).toMatchObject({
          id: created.id,
          firstName: "Upper",
        });
      });

      it("fails with NOT_FOUND for an unknown user", async () => {
        const { body } = await graphqlRequest(app, UPDATE, {
          cookies: admin,
          variables: { input: updateInput(MISSING_ID) },
        });

        expect(body.errors?.[0]).toMatchObject({
          message: "User not found",
          extensions: { code: "NOT_FOUND" },
        });
      });

      it("refuses an admin who removes their own Admin role (OWN_ROLE, D24), even with another admin", async () => {
        await createAsAdmin({ role: Role.ADMIN });

        const { body } = await graphqlRequest(app, UPDATE, {
          cookies: admin,
          variables: { input: updateInput(adminId, { role: Role.USER }) },
        });

        expect(body.errors?.[0]?.extensions).toMatchObject({
          code: "CONFLICT",
          reason: "OWN_ROLE",
        });
        await expect(
          prisma.user.findUniqueOrThrow({ where: { id: adminId } }),
        ).resolves.toMatchObject({ role: Role.ADMIN, firstName: null });
      });

      it("lets an admin fill in their own profile while keeping the Admin role", async () => {
        const { body } = await graphqlRequest(app, UPDATE, {
          cookies: admin,
          variables: { input: updateInput(adminId, { role: Role.ADMIN }) },
        });

        expect(body.errors).toBeUndefined();
        expect((body.data as { updateUser: UserRow }).updateUser).toMatchObject({
          firstName: "New",
          role: Role.ADMIN,
        });
      });

      it("demotes another admin, who loses the admin rights at once", async () => {
        const other = await createAsAdmin({ role: Role.ADMIN, password: TEST_PASSWORD });
        const otherCookies = await signIn(NEW_EMAIL);

        const { body } = await graphqlRequest(app, UPDATE, {
          cookies: admin,
          variables: { input: updateInput(other.id, { role: Role.USER }) },
        });

        expect(body.errors).toBeUndefined();
        // The session of the demoted admin is still valid, but the role is read from the database.
        const { body: afterDemotion } = await graphqlRequest(app, CREATE, {
          cookies: otherCookies,
          variables: { input: createInput({ email: "late@example.com" }) },
        });
        expect(afterDemotion.errors?.[0]?.extensions.code).toBe("FORBIDDEN");
      });
    });
  });

  describe("deleteUser and the D24 rules", () => {
    let adminId: string;
    let departmentId: string;
    let positionId: string;
    let skillId: string;

    /** A verified user who can sign in with `TEST_PASSWORD`, and their session cookies. */
    async function signedInUser(
      email: string,
      role: Role,
    ): Promise<{ id: string; cookies: string[] }> {
      const { id } = await createUser(app, { email, role });
      return { id, cookies: await signIn(email) };
    }

    async function deleteAs(cookies: string[], id: string) {
      return (await graphqlRequest(app, DELETE, { cookies, variables: { id } })).body;
    }

    /** `updateUser` that keeps the profile and sets `role`. */
    async function setRoleAs(cookies: string[], id: string, role: Role) {
      const input = { id, firstName: "Race", lastName: "Admin", departmentId, positionId, role };
      return (await graphqlRequest(app, UPDATE, { cookies, variables: { input } })).body;
    }

    const adminCount = () => prisma.user.count({ where: { role: Role.ADMIN } });

    beforeAll(async () => {
      adminId = (await prisma.user.findUniqueOrThrow({ where: { email: ADMIN_EMAIL } })).id;
      departmentId = (await prisma.department.create({ data: { name: "Engineering" } })).id;
      positionId = (await prisma.position.create({ data: { name: "Developer" } })).id;
      const category = await prisma.skillCategory.create({
        data: { name: "Programming languages", type: "Technical" },
      });
      skillId = (
        await prisma.skill.create({ data: { name: "TypeScript", categoryId: category.id } })
      ).id;
    });

    afterEach(async () => {
      await prisma.user.deleteMany({ where: { email: { notIn: [ADMIN_EMAIL, USER_EMAIL] } } });
      // The race tests make this admin a plain user, so that the two racing admins are the only ones.
      await prisma.user.update({ where: { id: adminId }, data: { role: Role.ADMIN } });
    });

    afterAll(async () => {
      await prisma.skill.deleteMany();
      await prisma.skillCategory.deleteMany();
      await prisma.department.deleteMany();
      await prisma.position.deleteMany();
    });

    describe("authorization", () => {
      it("refuses a visitor who is not signed in", async () => {
        const body = await deleteAs([], MISSING_ID);

        expect(body.errors?.[0]?.extensions.code).toBe("UNAUTHENTICATED");
      });

      it("refuses a user who is not an admin and deletes nothing (AC-21, AC-30)", async () => {
        const target = await createUser(app, { email: "target@example.com" });

        const body = await deleteAs(user, target.id);

        expect(body.errors?.[0]?.extensions.code).toBe("FORBIDDEN");
        await expect(prisma.user.findUnique({ where: { id: target.id } })).resolves.not.toBeNull();
      });
    });

    describe("deleteUser", () => {
      it("deletes the user and everything the user owns, but not the catalog (AC-31, AC-32, D13)", async () => {
        const target = await signedInUser("target@example.com", Role.USER);
        const cv = await prisma.cv.create({
          data: { name: "CV", education: "University", description: "About me", userId: target.id },
        });
        await prisma.cvSkill.create({ data: { cvId: cv.id, skillId, mastery: "EXPERT" } });
        await prisma.userSkill.create({ data: { userId: target.id, skillId, mastery: "EXPERT" } });

        const body = await deleteAs(admin, target.id);

        expect(body.errors).toBeUndefined();
        expect(body.data).toEqual({ deleteUser: true });
        await expect(prisma.user.findUnique({ where: { id: target.id } })).resolves.toBeNull();
        await expect(prisma.cv.count({ where: { userId: target.id } })).resolves.toBe(0);
        await expect(prisma.cvSkill.count({ where: { cvId: cv.id } })).resolves.toBe(0);
        await expect(prisma.userSkill.count({ where: { userId: target.id } })).resolves.toBe(0);
        await expect(prisma.refreshToken.count({ where: { userId: target.id } })).resolves.toBe(0);
        await expect(prisma.skill.count({ where: { id: skillId } })).resolves.toBe(1);
      });

      it("ends the deleted user's session at once", async () => {
        const target = await signedInUser("target@example.com", Role.USER);

        await deleteAs(admin, target.id);
        const { body } = await graphqlRequest(app, LIST, { cookies: target.cookies });

        expect(body.errors?.[0]?.extensions.code).toBe("UNAUTHENTICATED");
      });

      it("fails with NOT_FOUND for an unknown user", async () => {
        const body = await deleteAs(admin, MISSING_ID);

        expect(body.errors?.[0]).toMatchObject({
          message: "User not found",
          extensions: { code: "NOT_FOUND" },
        });
      });

      it("fails with BAD_USER_INPUT for an id that is not a UUID", async () => {
        const body = await deleteAs(admin, "not-a-uuid");

        expect(body.errors?.[0]?.extensions.code).toBe("BAD_USER_INPUT");
      });

      it("refuses an admin who deletes themselves (SELF_DELETE, D24), even with another admin", async () => {
        await createUser(app, { email: "second.admin@example.com", role: Role.ADMIN });

        const body = await deleteAs(admin, adminId);

        expect(body.errors?.[0]?.extensions).toMatchObject({
          code: "CONFLICT",
          reason: "SELF_DELETE",
        });
        await expect(prisma.user.findUnique({ where: { id: adminId } })).resolves.not.toBeNull();
      });

      it("refuses SELF_DELETE also when the admin's own id comes in upper case", async () => {
        await createUser(app, { email: "second.admin@example.com", role: Role.ADMIN });

        const body = await deleteAs(admin, adminId.toUpperCase());

        expect(body.errors?.[0]?.extensions).toMatchObject({
          code: "CONFLICT",
          reason: "SELF_DELETE",
        });
        await expect(prisma.user.findUnique({ where: { id: adminId } })).resolves.not.toBeNull();
      });

      it("deletes another admin while a second admin remains", async () => {
        const other = await createUser(app, {
          email: "second.admin@example.com",
          role: Role.ADMIN,
        });

        const body = await deleteAs(admin, other.id);

        expect(body.errors).toBeUndefined();
        await expect(adminCount()).resolves.toBe(1);
      });
    });

    describe("two admins at the same moment (D24)", () => {
      // Each race runs several times: the requests overlap differently each time, and the rule must hold in all.
      const ROUNDS = 10;

      /** Two admins who are the only admins, each signed in. */
      async function twoOnlyAdmins(round: number) {
        await prisma.user.update({ where: { id: adminId }, data: { role: Role.USER } });
        const a = await signedInUser(`race.a.${round}@example.com`, Role.ADMIN);
        const b = await signedInUser(`race.b.${round}@example.com`, Role.ADMIN);
        return { a, b };
      }

      /**
       * The losing request finds its actor no longer an admin: either after waiting for the lock (the service
       * says `FORBIDDEN`), or because it started after the winner had committed (the guard says `FORBIDDEN`
       * after a demotion, `UNAUTHENTICATED` after a delete).
       */
      const LOSER = expect.objectContaining({
        extensions: expect.objectContaining({
          code: expect.stringMatching(/^(FORBIDDEN|UNAUTHENTICATED)$/) as string,
        }) as object,
      }) as object;

      async function expectOneWinner(
        race: (
          a: { id: string; cookies: string[] },
          b: { id: string; cookies: string[] },
        ) => Promise<{ errors?: unknown[] }[]>,
      ) {
        for (let round = 0; round < ROUNDS; round++) {
          const { a, b } = await twoOnlyAdmins(round);

          const results = await race(a, b);

          const failed = results.filter((result) => result.errors !== undefined);
          expect(failed).toHaveLength(1);
          expect(failed[0]?.errors?.[0]).toEqual(LOSER);
          await expect(adminCount()).resolves.toBe(1);
          await prisma.user.deleteMany({ where: { email: { startsWith: "race." } } });
        }
      }

      it("two admins who demote each other: exactly one wins, one admin remains", async () => {
        await expectOneWinner((a, b) =>
          Promise.all([
            setRoleAs(a.cookies, b.id, Role.USER),
            setRoleAs(b.cookies, a.id, Role.USER),
          ]),
        );
      });

      it("two admins who delete each other: exactly one wins, one admin remains", async () => {
        await expectOneWinner((a, b) =>
          Promise.all([deleteAs(a.cookies, b.id), deleteAs(b.cookies, a.id)]),
        );
      });

      it("one admin deletes the other while that one demotes the first: one admin remains", async () => {
        await expectOneWinner((a, b) =>
          Promise.all([deleteAs(a.cookies, b.id), setRoleAs(b.cookies, a.id, Role.USER)]),
        );
      });
    });
  });

  describe("updateProfile (User Details, Profile tab)", () => {
    let adminId: string;
    let userId: string;
    let departmentId: string;
    let positionId: string;

    /** A valid input for the user `id`: no role, no email, no password. */
    const profileInput = (id: string, overrides: Record<string, unknown> = {}) => ({
      id,
      firstName: "Profile",
      lastName: "Owner",
      departmentId,
      positionId,
      ...overrides,
    });

    async function updateProfileAs(cookies: string[], input: Record<string, unknown>) {
      return (await graphqlRequest(app, UPDATE_PROFILE, { cookies, variables: { input } })).body;
    }

    const savedUser = () => prisma.user.findUniqueOrThrow({ where: { id: userId } });

    beforeAll(async () => {
      adminId = (await prisma.user.findUniqueOrThrow({ where: { email: ADMIN_EMAIL } })).id;
      userId = (await prisma.user.findUniqueOrThrow({ where: { email: USER_EMAIL } })).id;
      departmentId = (await prisma.department.create({ data: { name: "Engineering" } })).id;
      positionId = (await prisma.position.create({ data: { name: "Developer" } })).id;
    });

    afterEach(async () => {
      await prisma.user.deleteMany({ where: { email: { notIn: [ADMIN_EMAIL, USER_EMAIL] } } });
      // The next test starts from no profile again.
      await prisma.user.updateMany({
        where: { id: { in: [adminId, userId] } },
        data: { firstName: null, lastName: null, departmentId: null, positionId: null },
      });
    });

    afterAll(async () => {
      await prisma.department.deleteMany();
      await prisma.position.deleteMany();
    });

    it("lets the owner save their names, department and position, and keeps the role", async () => {
      const body = await updateProfileAs(
        user,
        profileInput(userId, { firstName: " Profile ", lastName: " Owner " }),
      );

      expect(body.errors).toBeUndefined();
      expect((body.data as { updateProfile: UserRow }).updateProfile).toEqual({
        id: userId,
        email: USER_EMAIL,
        firstName: "Profile",
        lastName: "Owner",
        role: Role.USER,
        department: { id: departmentId, name: "Engineering" },
        position: { id: positionId, name: "Developer" },
      });
      await expect(savedUser()).resolves.toMatchObject({ firstName: "Profile", role: Role.USER });
    });

    it("lets an owner with an unverified email save (D16)", async () => {
      const { id } = await createUser(app, { email: "unverified@example.com", isVerified: false });
      const cookies = await signIn("unverified@example.com");

      const body = await updateProfileAs(cookies, profileInput(id));

      expect(body.errors).toBeUndefined();
    });

    it("lets an admin save another user's profile", async () => {
      const body = await updateProfileAs(admin, profileInput(userId));

      expect(body.errors).toBeUndefined();
      await expect(savedUser()).resolves.toMatchObject({ firstName: "Profile" });
    });

    it("refuses a visitor who is not signed in", async () => {
      const body = await updateProfileAs([], profileInput(userId));

      expect(body.errors?.[0]?.extensions.code).toBe("UNAUTHENTICATED");
    });

    it.each([
      ["another user's profile", () => adminId],
      ["an unknown id, so ids cannot be probed", () => MISSING_ID],
    ])("refuses with FORBIDDEN a user who edits %s and changes nothing", async (_case, id) => {
      const body = await updateProfileAs(user, profileInput(id()));

      expect(body.errors?.[0]?.extensions.code).toBe("FORBIDDEN");
      await expect(
        prisma.user.findUniqueOrThrow({ where: { id: adminId } }),
      ).resolves.toMatchObject({ firstName: null });
    });

    it("fails with NOT_FOUND when an admin edits an unknown user", async () => {
      const body = await updateProfileAs(admin, profileInput(MISSING_ID));

      expect(body.errors?.[0]).toMatchObject({
        message: "User not found",
        extensions: { code: "NOT_FOUND" },
      });
    });

    it.each([
      ["firstName", "an empty first name", { firstName: " " }],
      ["lastName", "a last name longer than 100 characters", { lastName: "a".repeat(101) }],
      ["departmentId", "a missing department", { departmentId: MISSING_ID }],
      ["positionId", "a missing position", { positionId: MISSING_ID }],
    ])(
      "rejects %s: %s, with a field error and changes nothing",
      async (field, _case, overrides) => {
        const body = await updateProfileAs(user, profileInput(userId, overrides));

        expect(body.errors?.[0]?.extensions).toMatchObject({
          code: "BAD_USER_INPUT",
          fieldErrors: [expect.objectContaining({ field })],
        });
        await expect(savedUser()).resolves.toMatchObject({ firstName: null });
      },
    );

    it.each([
      ["role", { role: Role.ADMIN }],
      ["email", { email: "other@example.com" }],
    ])("has no %s in its input, so a user cannot change it", async (_field, extra) => {
      // An unknown input field fails while GraphQL reads the variables, with HTTP 400,
      // so this request goes without graphqlRequest (it expects 200).
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .set("Cookie", user.join("; "))
        .send({
          query: UPDATE_PROFILE,
          variables: { input: { ...profileInput(userId), ...extra } },
        })
        .expect(400);

      expect((response.body as GraphQLBody).errors?.[0]?.extensions.code).toBe("BAD_USER_INPUT");
      await expect(savedUser()).resolves.toMatchObject({ role: Role.USER, email: USER_EMAIL });
    });
  });
});

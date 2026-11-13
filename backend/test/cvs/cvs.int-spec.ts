import type { NestExpressApplication } from "@nestjs/platform-express";
import { Role } from "../../src/generated/prisma/enums";
import { PrismaService } from "../../src/prisma/prisma.service";
import { createTestApp } from "../support/create-test-app";
import { createUser } from "../support/create-user";
import { graphqlRequest, toCookiePair } from "../support/graphql-request";
import type { GraphQLBody } from "../support/graphql-request";

const SIGN_IN = `mutation ($input: SignInInput!) { signIn(input: $input) { id } }`;
const CV_FIELDS = "id name education description userId ownerEmail";
const LIST = `query ($search: String, $sort: SortInput, $page: PageInput!, $userId: ID) {
  cvs(search: $search, sort: $sort, page: $page, userId: $userId) { total items { ${CV_FIELDS} } }
}`;
const GET = `query ($id: ID!) { cv(id: $id) { ${CV_FIELDS} } }`;
const CREATE = `mutation ($input: CreateCvInput!) { createCv(input: $input) { ${CV_FIELDS} } }`;
const UPDATE = `mutation ($input: UpdateCvInput!) { updateCv(input: $input) { ${CV_FIELDS} } }`;
const DELETE = `mutation ($id: ID!) { deleteCv(id: $id) { id name } }`;

const PAGE = { number: 1, size: 10 };
const NEW_CV = { name: "New CV", education: "BSc", description: "About me" };
const MISSING_ID = "00000000-0000-4000-8000-000000000000";

interface CvItem {
  id: string;
  name: string;
  ownerEmail: string;
  userId: string;
}

describe("cvs", () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let admin: { id: string; cookie: string };
  let ann: { id: string; cookie: string };
  let ben: { id: string; cookie: string };
  let unverified: { id: string; cookie: string };
  let annCvId: string;
  let benCvId: string;

  async function addUser(email: string, role: Role = Role.USER, isVerified = true) {
    const user = await createUser(app, { email, role, isVerified });
    const { setCookies } = await graphqlRequest(app, SIGN_IN, {
      variables: { input: { email, password: "Password123!" } },
    });
    const access = setCookies.find((cookie) => cookie.startsWith("access_token="));
    return { id: user.id, cookie: toCookiePair(access ?? "") };
  }

  function call(
    who: { cookie: string } | null,
    query: string,
    variables: Record<string, unknown> = {},
  ) {
    return graphqlRequest(app, query, { cookies: who ? [who.cookie] : [], variables });
  }

  async function list(who: { cookie: string }, variables: Record<string, unknown> = {}) {
    const { body } = await call(who, LIST, { page: PAGE, ...variables });
    const data = body.data?.["cvs"] as { total: number; items: CvItem[] };
    return { ...data, names: data.items.map((item) => item.name) };
  }

  function errorOf(body: GraphQLBody) {
    return body.errors?.[0];
  }

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    admin = await addUser("admin@example.com", Role.ADMIN);
    ann = await addUser("ann@example.com");
    ben = await addUser("ben@example.com");
    unverified = await addUser("new@example.com", Role.USER, false);

    const cv = (userId: string, name: string) =>
      prisma.cv.create({ data: { userId, name, education: "MSc", description: "Text" } });
    annCvId = (await cv(ann.id, "Ann Backend")).id;
    await cv(ann.id, "Ann Frontend");
    benCvId = (await cv(ben.id, "Ben Backend")).id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe("cvs query", () => {
    it("shows a user only their own CVs, with their email", async () => {
      const result = await list(ann);

      expect(result.total).toBe(2);
      expect(result.names).toEqual(["Ann Backend", "Ann Frontend"]);
      expect(result.items.every((item) => item.ownerEmail === "ann@example.com")).toBe(true);
    });

    it("shows an admin the CVs of all users", async () => {
      expect((await list(admin)).total).toBe(3);
    });

    it("lets an admin filter by user", async () => {
      const result = await list(admin, { userId: ben.id });

      expect(result.names).toEqual(["Ben Backend"]);
    });

    it("refuses a user who asks for the CVs of another user", async () => {
      const { body } = await call(ann, LIST, { page: PAGE, userId: ben.id });

      expect(errorOf(body)?.extensions.code).toBe("FORBIDDEN");
    });

    it("refuses a request without a session", async () => {
      const { body } = await call(null, LIST, { page: PAGE });

      expect(errorOf(body)?.extensions.code).toBe("UNAUTHENTICATED");
    });

    it("searches the name without regard to case", async () => {
      const result = await list(admin, { search: "BACKEND" });

      expect(result.names).toEqual(["Ann Backend", "Ben Backend"]);
    });

    it("lets an admin search by the email of the owner", async () => {
      const result = await list(admin, { search: "BEN@" });

      expect(result.names).toEqual(["Ben Backend"]);
    });

    it("does not search the email for a user, and never shows other CVs", async () => {
      expect((await list(ann, { search: "ann@" })).total).toBe(0);
      expect((await list(ann, { search: "Ben" })).total).toBe(0);
    });

    it("sorts by name in both directions", async () => {
      const desc = await list(admin, { sort: { field: "name", direction: "DESC" } });

      expect(desc.names).toEqual(["Ben Backend", "Ann Frontend", "Ann Backend"]);
    });

    it("rejects a sort field that is not allowed", async () => {
      const { body } = await call(admin, LIST, {
        page: PAGE,
        sort: { field: "passwordHash", direction: "ASC" },
      });

      expect(errorOf(body)?.extensions.code).toBe("BAD_USER_INPUT");
    });

    it("pages the result and keeps the total of all matches", async () => {
      const second = await list(admin, { page: { number: 2, size: 2 } });

      expect(second.total).toBe(3);
      expect(second.names).toEqual(["Ben Backend"]);
    });

    it("returns an empty page beyond the last one", async () => {
      const result = await list(admin, { page: { number: 9, size: 10 } });

      expect(result).toMatchObject({ total: 3, names: [] });
    });
  });

  describe("cv query", () => {
    it("returns an own CV", async () => {
      const { body } = await call(ann, GET, { id: annCvId });

      expect(body.data?.["cv"]).toMatchObject({ id: annCvId, ownerEmail: "ann@example.com" });
    });

    it("answers NOT_FOUND for the CV of another user, like for a missing one", async () => {
      const other = errorOf((await call(ann, GET, { id: benCvId })).body);
      const missing = errorOf((await call(ann, GET, { id: MISSING_ID })).body);

      expect(other?.extensions.code).toBe("NOT_FOUND");
      expect(other?.message).toBe(missing?.message);
    });

    it("returns any CV to an admin", async () => {
      const { body } = await call(admin, GET, { id: benCvId });

      expect(body.data?.["cv"]).toMatchObject({ id: benCvId, ownerEmail: "ben@example.com" });
    });

    it("rejects an id that is not a UUID instead of failing in the database", async () => {
      const { body } = await call(ann, GET, { id: "1 OR 1=1" });

      expect(errorOf(body)?.extensions.code).toBe("BAD_USER_INPUT");
    });
  });

  describe("createCv", () => {
    it("creates a CV for the signed-in user", async () => {
      const { body } = await call(ben, CREATE, { input: NEW_CV });

      expect(body.data?.["createCv"]).toMatchObject({ ...NEW_CV, userId: ben.id });
      expect(await prisma.cv.count({ where: { userId: ben.id } })).toBe(2);
    });

    it("trims the text", async () => {
      const { body } = await call(ben, CREATE, {
        input: { ...NEW_CV, name: "  Spaced  " },
      });

      expect(body.data?.["createCv"]).toMatchObject({ name: "Spaced" });
    });

    it("refuses a user who names another owner", async () => {
      const { body } = await call(ann, CREATE, { input: { ...NEW_CV, userId: ben.id } });

      expect(errorOf(body)?.extensions.code).toBe("FORBIDDEN");
      expect(await prisma.cv.count({ where: { name: NEW_CV.name, userId: ben.id } })).toBe(1);
    });

    it("lets an admin create a CV for another user", async () => {
      const { body } = await call(admin, CREATE, { input: { ...NEW_CV, userId: ann.id } });

      expect(body.data?.["createCv"]).toMatchObject({
        userId: ann.id,
        ownerEmail: "ann@example.com",
      });
    });

    it("reports a field error when the named owner does not exist", async () => {
      const { body } = await call(admin, CREATE, { input: { ...NEW_CV, userId: MISSING_ID } });

      expect(errorOf(body)?.extensions).toMatchObject({
        code: "BAD_USER_INPUT",
        fieldErrors: [{ field: "userId" }],
      });
    });

    it("validates the fields on the server", async () => {
      const { body } = await call(ann, CREATE, {
        input: { name: "   ", education: "x".repeat(256), description: "" },
      });

      expect(errorOf(body)?.extensions).toMatchObject({
        code: "BAD_USER_INPUT",
        fieldErrors: expect.arrayContaining([
          { field: "name", messages: ["Name is required"] },
          { field: "education", messages: ["Education must not exceed 255 characters"] },
          { field: "description", messages: ["Description is required"] },
        ]) as unknown,
      });
    });

    it("refuses a description of more than 2000 characters", async () => {
      const { body } = await call(ann, CREATE, {
        input: { ...NEW_CV, description: "x".repeat(2001) },
      });

      expect(errorOf(body)?.extensions).toMatchObject({
        code: "BAD_USER_INPUT",
        fieldErrors: [
          { field: "description", messages: ["Description must not exceed 2000 characters"] },
        ],
      });
    });

    it("needs a verified email (D16)", async () => {
      const { body } = await call(unverified, CREATE, { input: NEW_CV });

      expect(errorOf(body)?.extensions).toMatchObject({
        code: "FORBIDDEN",
        reason: "EMAIL_NOT_VERIFIED",
      });
      expect(await prisma.cv.count({ where: { userId: unverified.id } })).toBe(0);
    });
  });

  describe("updateCv", () => {
    const changes = { name: "Changed", education: "PhD", description: "Changed text" };

    it("updates an own CV and keeps the owner", async () => {
      const { body } = await call(ann, UPDATE, { input: { id: annCvId, ...changes } });

      expect(body.data?.["updateCv"]).toMatchObject({ id: annCvId, ...changes, userId: ann.id });
    });

    it("does not change the CV of another user", async () => {
      const { body } = await call(ann, UPDATE, { input: { id: benCvId, ...changes } });

      expect(errorOf(body)?.extensions.code).toBe("NOT_FOUND");
      expect((await prisma.cv.findUniqueOrThrow({ where: { id: benCvId } })).name).toBe(
        "Ben Backend",
      );
    });

    it("lets an admin update any CV", async () => {
      const { body } = await call(admin, UPDATE, { input: { id: benCvId, ...changes } });

      expect(body.data?.["updateCv"]).toMatchObject({ id: benCvId, userId: ben.id, ...changes });
    });

    it("validates the fields on the server", async () => {
      const { body } = await call(ann, UPDATE, { input: { id: annCvId, ...changes, name: "" } });

      expect(errorOf(body)?.extensions.code).toBe("BAD_USER_INPUT");
    });

    it("needs a verified email (D16)", async () => {
      const cv = await prisma.cv.create({ data: { userId: unverified.id, ...NEW_CV } });

      const { body } = await call(unverified, UPDATE, { input: { id: cv.id, ...changes } });

      expect(errorOf(body)?.extensions.reason).toBe("EMAIL_NOT_VERIFIED");
    });
  });

  describe("deleteCv", () => {
    it("deletes an own CV", async () => {
      const cv = await prisma.cv.create({ data: { userId: ann.id, ...NEW_CV } });

      const { body } = await call(ann, DELETE, { id: cv.id });

      expect(body.data?.["deleteCv"]).toEqual({ id: cv.id, name: NEW_CV.name });
      expect(await prisma.cv.findUnique({ where: { id: cv.id } })).toBeNull();
    });

    it("does not delete the CV of another user", async () => {
      const { body } = await call(ann, DELETE, { id: benCvId });

      expect(errorOf(body)?.extensions.code).toBe("NOT_FOUND");
      expect(await prisma.cv.findUnique({ where: { id: benCvId } })).not.toBeNull();
    });

    it("lets an admin delete any CV", async () => {
      const cv = await prisma.cv.create({ data: { userId: ben.id, ...NEW_CV } });

      await call(admin, DELETE, { id: cv.id });

      expect(await prisma.cv.findUnique({ where: { id: cv.id } })).toBeNull();
    });

    it("answers NOT_FOUND for a CV that is already gone", async () => {
      const { body } = await call(admin, DELETE, { id: MISSING_ID });

      expect(errorOf(body)?.extensions.code).toBe("NOT_FOUND");
    });

    it("needs a verified email (D16)", async () => {
      const cv = await prisma.cv.create({ data: { userId: unverified.id, ...NEW_CV } });

      const { body } = await call(unverified, DELETE, { id: cv.id });

      expect(errorOf(body)?.extensions.reason).toBe("EMAIL_NOT_VERIFIED");
      expect(await prisma.cv.findUnique({ where: { id: cv.id } })).not.toBeNull();
    });
  });

  it("removes the CVs of a user together with the user (D13)", async () => {
    await prisma.user.delete({ where: { id: unverified.id } });

    expect(await prisma.cv.count({ where: { userId: unverified.id } })).toBe(0);
  });
});

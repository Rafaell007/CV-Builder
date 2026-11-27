import type { NestExpressApplication } from "@nestjs/platform-express";
import { Role } from "../../src/generated/prisma/enums";
import { PrismaService } from "../../src/prisma/prisma.service";
import { createTestApp } from "../support/create-test-app";
import { createUser } from "../support/create-user";
import { graphqlRequest, toCookiePair } from "../support/graphql-request";
import type { GraphQLBody } from "../support/graphql-request";

const SIGN_IN = `mutation ($input: SignInInput!) { signIn(input: $input) { id } }`;
const FIELDS = `id cvId startDate endDate responsibilities
  project { id name domain description startDate endDate environment { id name } }
  roles { id name }`;
const LIST = `query ($cvId: ID!, $search: String, $sort: SortInput) {
  cvProjects(cvId: $cvId, search: $search, sort: $sort) { ${FIELDS} }
}`;
const AVAILABLE = `query ($cvId: ID!) {
  availableCvProjects(cvId: $cvId) { id name domain description startDate endDate environment { name } }
}`;
const ADD = `mutation ($input: AddCvProjectInput!) { addCvProject(input: $input) { ${FIELDS} } }`;
const UPDATE = `mutation ($input: UpdateCvProjectInput!) { updateCvProject(input: $input) { ${FIELDS} } }`;
const REMOVE = `mutation ($input: RemoveCvProjectsInput!) { removeCvProjects(input: $input) }`;

const MISSING_ID = "00000000-0000-4000-8000-000000000000";

interface Entry {
  id: string;
  cvId: string;
  startDate: string;
  endDate: string | null;
  responsibilities: string | null;
  project: { id: string; name: string; environment: { name: string }[] };
  roles: { name: string }[];
}

type Who = { id: string; cookie: string };

describe("cv projects", () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let admin: Who;
  let ann: Who;
  let ben: Who;
  let unverified: Who;
  let annCv: string;
  let annOtherCv: string;
  let benCv: string;
  let unverifiedCv: string;
  let bank: string;
  let shop: string;
  let developer: string;
  let tester: string;
  let typescript: string;

  async function addUser(email: string, role: Role = Role.USER, isVerified = true): Promise<Who> {
    const user = await createUser(app, { email, role, isVerified });
    const { setCookies } = await graphqlRequest(app, SIGN_IN, {
      variables: { input: { email, password: "Password123!" } },
    });
    const access = setCookies.find((cookie) => cookie.startsWith("access_token="));
    return { id: user.id, cookie: toCookiePair(access ?? "") };
  }

  function call(who: Who | null, query: string, variables: Record<string, unknown> = {}) {
    return graphqlRequest(app, query, { cookies: who ? [who.cookie] : [], variables });
  }

  async function list(who: Who, cvId: string, variables: Record<string, unknown> = {}) {
    const { body } = await call(who, LIST, { cvId, ...variables });
    expect(body.errors).toBeUndefined();
    const entries = body.data?.["cvProjects"] as Entry[];
    return { entries, names: entries.map((entry) => entry.project.name) };
  }

  async function add(who: Who, overrides: Record<string, unknown> = {}) {
    return call(who, ADD, {
      input: {
        cvId: annCv,
        projectId: bank,
        startDate: "2026-03-01",
        roleIds: [developer],
        ...overrides,
      },
    });
  }

  async function addedEntry(who: Who, overrides: Record<string, unknown> = {}): Promise<Entry> {
    const { body } = await add(who, overrides);
    expect(body.errors).toBeUndefined();
    return body.data?.["addCvProject"] as Entry;
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

    const cv = async (userId: string, name: string) =>
      (await prisma.cv.create({ data: { userId, name, education: "MSc", description: "Text" } }))
        .id;
    annCv = await cv(ann.id, "Ann Backend");
    annOtherCv = await cv(ann.id, "Ann Frontend");
    benCv = await cv(ben.id, "Ben Backend");
    unverifiedCv = await cv(unverified.id, "New CV");

    const category = await prisma.skillCategory.create({
      data: { name: "Languages", type: "TECH" },
    });
    typescript = (
      await prisma.skill.create({ data: { name: "TypeScript", categoryId: category.id } })
    ).id;
    developer = (await prisma.projectRole.create({ data: { name: "Developer" } })).id;
    tester = (await prisma.projectRole.create({ data: { name: "Tester" } })).id;

    const project = async (name: string, domain: string) =>
      (
        await prisma.project.create({
          data: {
            name,
            domain,
            description: "Catalog text",
            startDate: new Date("2026-01-01"),
            endDate: new Date("2026-12-31"),
            skills: { create: [{ skillId: typescript }] },
          },
        })
      ).id;
    bank = await project("Bank App", "Finance");
    shop = await project("Web Shop", "Retail");
  });

  beforeEach(async () => {
    await prisma.cvProject.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("cvProjects query", () => {
    it("shows the entries of the CV with project data, environment and roles (AC-2, AC-3, AC-8)", async () => {
      await addedEntry(ann, { responsibilities: "Built the API", roleIds: [developer, tester] });

      const { entries } = await list(ann, annCv);

      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({
        cvId: annCv,
        responsibilities: "Built the API",
        project: { name: "Bank App", environment: [{ name: "TypeScript" }] },
        roles: [{ name: "Developer" }, { name: "Tester" }],
      });
    });

    it("shows only the entries of the selected CV (AC-2, AC-40)", async () => {
      await addedEntry(ann);
      await addedEntry(ann, { cvId: annOtherCv, projectId: shop });

      expect((await list(ann, annCv)).names).toEqual(["Bank App"]);
      expect((await list(ann, annOtherCv)).names).toEqual(["Web Shop"]);
    });

    it("answers an empty list for a CV without projects", async () => {
      expect((await list(ann, annCv)).entries).toEqual([]);
    });

    it("searches the name and the domain without regard to case (AC-4, AC-5)", async () => {
      await addedEntry(ann);
      await addedEntry(ann, { projectId: shop });

      expect((await list(ann, annCv, { search: "BANK" })).names).toEqual(["Bank App"]);
      expect((await list(ann, annCv, { search: "retail" })).names).toEqual(["Web Shop"]);
      expect((await list(ann, annCv, { search: "" })).names).toEqual(["Bank App", "Web Shop"]);
      expect((await list(ann, annCv, { search: "nothing" })).names).toEqual([]);
    });

    it("never finds the entries of another CV by search (AC-40)", async () => {
      await addedEntry(ann, { cvId: annOtherCv });

      expect((await list(ann, annCv, { search: "Bank" })).names).toEqual([]);
    });

    it("sorts by name, start date and end date, both ways (AC-6)", async () => {
      await addedEntry(ann, { startDate: "2026-05-01", endDate: "2026-06-01" });
      await addedEntry(ann, { projectId: shop, startDate: "2026-02-01", endDate: "2026-09-01" });
      const sorted = async (field: string, direction: string) =>
        (await list(ann, annCv, { sort: { field, direction } })).names;

      expect(await sorted("name", "ASC")).toEqual(["Bank App", "Web Shop"]);
      expect(await sorted("name", "DESC")).toEqual(["Web Shop", "Bank App"]);
      expect(await sorted("startDate", "ASC")).toEqual(["Web Shop", "Bank App"]);
      expect(await sorted("startDate", "DESC")).toEqual(["Bank App", "Web Shop"]);
      expect(await sorted("endDate", "ASC")).toEqual(["Bank App", "Web Shop"]);
      expect(await sorted("endDate", "DESC")).toEqual(["Web Shop", "Bank App"]);
    });

    it("puts Till now (no end date) last when ascending and first when descending", async () => {
      await addedEntry(ann, { endDate: null });
      await addedEntry(ann, { projectId: shop, endDate: "2026-09-01" });
      const sorted = async (direction: string) =>
        (await list(ann, annCv, { sort: { field: "endDate", direction } })).names;

      expect(await sorted("ASC")).toEqual(["Web Shop", "Bank App"]);
      expect(await sorted("DESC")).toEqual(["Bank App", "Web Shop"]);
    });

    it("rejects a sort field that is not allowed", async () => {
      const { body } = await call(ann, LIST, {
        cvId: annCv,
        sort: { field: "responsibilities", direction: "ASC" },
      });

      expect(errorOf(body)?.extensions.code).toBe("BAD_USER_INPUT");
    });

    it("answers NOT_FOUND for the CV of another user, like for a missing CV (AC-28, AC-29)", async () => {
      await addedEntry(ben, { cvId: benCv });

      const other = await call(ann, LIST, { cvId: benCv });
      const missing = await call(ann, LIST, { cvId: MISSING_ID });

      expect(errorOf(other.body)?.extensions.code).toBe("NOT_FOUND");
      expect(errorOf(missing.body)?.extensions.code).toBe("NOT_FOUND");
      expect(other.body.data).toBeNull();
    });

    it("lets an admin read the entries of any CV (AC-30)", async () => {
      await addedEntry(ann);

      expect((await list(admin, annCv)).names).toEqual(["Bank App"]);
    });

    it("answers BAD_USER_INPUT for an id that is not a UUID", async () => {
      const { body } = await call(ann, LIST, { cvId: "not-a-uuid" });

      expect(errorOf(body)?.extensions.code).toBe("BAD_USER_INPUT");
    });

    it("refuses a call without a session", async () => {
      const { body } = await call(null, LIST, { cvId: annCv });

      expect(errorOf(body)?.extensions.code).toBe("UNAUTHENTICATED");
    });
  });

  describe("availableCvProjects query", () => {
    async function available(who: Who, cvId: string) {
      const { body } = await call(who, AVAILABLE, { cvId });
      expect(body.errors).toBeUndefined();
      return (body.data?.["availableCvProjects"] as { name: string }[]).map(({ name }) => name);
    }

    it("lets an Employee read the projects they can add to their own CV (KAN-156)", async () => {
      const { body } = await call(ann, AVAILABLE, { cvId: annCv });

      expect(body.errors).toBeUndefined();
      expect(body.data?.["availableCvProjects"]).toEqual([
        {
          id: bank,
          name: "Bank App",
          domain: "Finance",
          description: "Catalog text",
          startDate: "2026-01-01T00:00:00.000Z",
          endDate: "2026-12-31T00:00:00.000Z",
          environment: [{ name: "TypeScript" }],
        },
        {
          id: shop,
          name: "Web Shop",
          domain: "Retail",
          description: "Catalog text",
          startDate: "2026-01-01T00:00:00.000Z",
          endDate: "2026-12-31T00:00:00.000Z",
          environment: [{ name: "TypeScript" }],
        },
      ]);
    });

    it("leaves out the projects that the CV holds (AC-31)", async () => {
      await addedEntry(ann);

      expect(await available(ann, annCv)).toEqual(["Web Shop"]);
      // The other CV of the same owner is not affected.
      expect(await available(ann, annOtherCv)).toEqual(["Bank App", "Web Shop"]);
    });

    it("answers an empty list when the CV holds every project", async () => {
      await addedEntry(ann);
      await addedEntry(ann, { projectId: shop });

      expect(await available(ann, annCv)).toEqual([]);
    });

    it("orders the projects by name", async () => {
      const alpha = await prisma.project.create({
        data: {
          name: "Alpha Tool",
          domain: "Internal",
          description: "Catalog text",
          startDate: new Date("2026-01-01"),
          endDate: new Date("2026-12-31"),
        },
      });
      try {
        expect(await available(ann, annCv)).toEqual(["Alpha Tool", "Bank App", "Web Shop"]);
      } finally {
        await prisma.project.delete({ where: { id: alpha.id } });
      }
    });

    it("lets an admin read the options for the CV of any user (AC-30)", async () => {
      await addedEntry(ann);

      expect(await available(admin, annCv)).toEqual(["Web Shop"]);
    });

    it("answers NOT_FOUND for the CV of another user, like for a missing CV (AC-28, AC-29)", async () => {
      const other = await call(ann, AVAILABLE, { cvId: benCv });
      const missing = await call(ann, AVAILABLE, { cvId: MISSING_ID });

      expect(errorOf(other.body)?.extensions.code).toBe("NOT_FOUND");
      expect(errorOf(missing.body)?.extensions.code).toBe("NOT_FOUND");
      expect(other.body.data).toBeNull();
    });

    it("answers BAD_USER_INPUT for an id that is not a UUID", async () => {
      const { body } = await call(ann, AVAILABLE, { cvId: "not-a-uuid" });

      expect(errorOf(body)?.extensions.code).toBe("BAD_USER_INPUT");
    });

    it("refuses a call without a session", async () => {
      const { body } = await call(null, AVAILABLE, { cvId: annCv });

      expect(errorOf(body)?.extensions.code).toBe("UNAUTHENTICATED");
    });
  });

  describe("addCvProject", () => {
    it("stores the dates, the responsibilities and the roles on the CV project (AC-9, AC-35, AC-36, AC-38)", async () => {
      const entry = await addedEntry(ann, {
        startDate: "2026-03-01",
        endDate: "2026-06-30",
        responsibilities: "Built the API",
        roleIds: [developer, tester],
      });

      expect(entry).toMatchObject({
        cvId: annCv,
        startDate: "2026-03-01T00:00:00.000Z",
        endDate: "2026-06-30T00:00:00.000Z",
        responsibilities: "Built the API",
        project: { name: "Bank App" },
      });
      const stored = await prisma.cvProject.findUniqueOrThrow({
        where: { id: entry.id },
        include: { roles: true },
      });
      expect(stored.roles.map(({ roleId }) => roleId).sort()).toEqual([developer, tester].sort());
    });

    it("accepts Till now as the end date and no responsibilities (AC-17)", async () => {
      const entry = await addedEntry(ann, { endDate: null, responsibilities: "   " });

      expect(entry).toMatchObject({ endDate: null, responsibilities: null });
    });

    it("does not change the project of the catalog (AC-37)", async () => {
      const before = await prisma.project.findUniqueOrThrow({ where: { id: bank } });

      await addedEntry(ann, { responsibilities: "Something else", startDate: "2026-05-05" });

      expect(await prisma.project.findUniqueOrThrow({ where: { id: bank } })).toEqual(before);
    });

    it("accepts the first and the last day of the project (AC-15)", async () => {
      const entry = await addedEntry(ann, { startDate: "2026-01-01", endDate: "2026-12-31" });

      expect(entry.startDate).toBe("2026-01-01T00:00:00.000Z");
    });

    it("rejects a duplicate project in the same CV, and allows it in another CV (AC-31)", async () => {
      await addedEntry(ann);

      const duplicate = await add(ann);
      const otherCv = await add(ann, { cvId: annOtherCv });

      expect(errorOf(duplicate.body)?.extensions.code).toBe("CONFLICT");
      expect(otherCv.body.errors).toBeUndefined();
      expect(await prisma.cvProject.count({ where: { cvId: annCv } })).toBe(1);
    });

    it("keeps only one entry when the same project is added twice at the same time (AC-31)", async () => {
      const results = await Promise.all([add(ann), add(ann)]);

      const failures = results.filter(({ body }) => body.errors !== undefined);
      expect(failures).toHaveLength(1);
      expect(errorOf(failures[0]?.body ?? {})?.extensions.code).toBe("CONFLICT");
      expect(await prisma.cvProject.count({ where: { cvId: annCv } })).toBe(1);
    });

    it("rejects a project that does not exist (AC-32)", async () => {
      const { body } = await add(ann, { projectId: MISSING_ID });

      expect(errorOf(body)?.extensions).toMatchObject({
        code: "BAD_USER_INPUT",
        fieldErrors: [{ field: "projectId", messages: ["Project not found"] }],
      });
      expect(await prisma.cvProject.count()).toBe(0);
    });

    it("rejects a role that does not exist (AC-33)", async () => {
      const { body } = await add(ann, { roleIds: [developer, MISSING_ID] });

      expect(errorOf(body)?.extensions).toMatchObject({
        code: "BAD_USER_INPUT",
        fieldErrors: [{ field: "roleIds" }],
      });
      expect(await prisma.cvProject.count()).toBe(0);
    });

    it("requires at least one role (AC-16)", async () => {
      const { body } = await add(ann, { roleIds: [] });

      expect(errorOf(body)?.extensions).toMatchObject({
        code: "BAD_USER_INPUT",
        fieldErrors: [{ field: "roleIds", messages: ["At least one role must be selected"] }],
      });
      expect(await prisma.cvProject.count()).toBe(0);
    });

    it("rejects the same role twice", async () => {
      const { body } = await add(ann, { roleIds: [developer, developer] });

      expect(errorOf(body)?.extensions.code).toBe("BAD_USER_INPUT");
    });

    it("rejects dates outside the dates of the project with the messages of the page (AC-15, AC-34)", async () => {
      const early = await add(ann, { startDate: "2025-12-31" });
      const late = await add(ann, { endDate: "2027-01-01" });

      expect(errorOf(early.body)?.extensions.fieldErrors).toEqual([
        {
          field: "startDate",
          messages: ["Start date must be within project duration"],
          reasons: ["START_OUTSIDE_PROJECT"],
        },
      ]);
      expect(errorOf(late.body)?.extensions.fieldErrors).toEqual([
        {
          field: "endDate",
          messages: ["End date must be within project duration"],
          reasons: ["END_OUTSIDE_PROJECT"],
        },
      ]);
      expect(await prisma.cvProject.count()).toBe(0);
    });

    it("rejects an end date before the start date", async () => {
      const { body } = await add(ann, { startDate: "2026-05-01", endDate: "2026-04-30" });

      expect(errorOf(body)?.extensions.fieldErrors).toEqual([
        {
          field: "endDate",
          messages: ["End date cannot be earlier than start date"],
          reasons: ["END_BEFORE_START"],
        },
      ]);
    });

    it("answers NOT_FOUND for the CV of another user and adds nothing (AC-28, AC-29)", async () => {
      const { body } = await add(ann, { cvId: benCv });

      expect(errorOf(body)?.extensions.code).toBe("NOT_FOUND");
      expect(await prisma.cvProject.count()).toBe(0);
    });

    it("lets an admin add a project to the CV of another user (AC-30)", async () => {
      const entry = await addedEntry(admin, { cvId: benCv });

      expect(entry.cvId).toBe(benCv);
    });

    it("refuses an unverified user and adds nothing (D16)", async () => {
      const { body } = await add(unverified, { cvId: unverifiedCv });

      expect(errorOf(body)?.extensions).toMatchObject({
        code: "FORBIDDEN",
        reason: "EMAIL_NOT_VERIFIED",
      });
      expect(await prisma.cvProject.count()).toBe(0);
    });

    it("refuses a call without a session", async () => {
      const { body } = await add({ id: "", cookie: "" });

      expect(errorOf(body)?.extensions.code).toBe("UNAUTHENTICATED");
    });
  });

  describe("updateCvProject", () => {
    const change = (id: string, overrides: Record<string, unknown> = {}) => ({
      id,
      startDate: "2026-04-01",
      endDate: "2026-08-31",
      responsibilities: "Led the team",
      roleIds: [tester],
      ...overrides,
    });

    it("replaces the dates, the responsibilities and the roles (AC-10)", async () => {
      const entry = await addedEntry(ann, { roleIds: [developer] });

      const { body } = await call(ann, UPDATE, { input: change(entry.id) });

      expect(body.errors).toBeUndefined();
      expect(body.data?.["updateCvProject"]).toMatchObject({
        id: entry.id,
        startDate: "2026-04-01T00:00:00.000Z",
        endDate: "2026-08-31T00:00:00.000Z",
        responsibilities: "Led the team",
        roles: [{ name: "Tester" }],
      });
      const stored = await prisma.cvProject.findUniqueOrThrow({
        where: { id: entry.id },
        include: { roles: true },
      });
      expect(stored.roles.map(({ roleId }) => roleId)).toEqual([tester]);
    });

    it("keeps the project and does not change the catalog (AC-19, AC-37)", async () => {
      const entry = await addedEntry(ann);
      const before = await prisma.project.findUniqueOrThrow({ where: { id: bank } });

      await call(ann, UPDATE, { input: change(entry.id) });

      const stored = await prisma.cvProject.findUniqueOrThrow({ where: { id: entry.id } });
      expect(stored.projectId).toBe(bank);
      expect(await prisma.project.findUniqueOrThrow({ where: { id: bank } })).toEqual(before);
    });

    it("clears the end date and the responsibilities when the input sends none", async () => {
      const entry = await addedEntry(ann, { endDate: "2026-06-30", responsibilities: "Text" });

      const { body } = await call(ann, UPDATE, {
        input: change(entry.id, { endDate: null, responsibilities: null }),
      });

      expect(body.data?.["updateCvProject"]).toMatchObject({
        endDate: null,
        responsibilities: null,
      });
    });

    it("rejects dates outside the project and leaves the entry unchanged (AC-15, AC-34)", async () => {
      const entry = await addedEntry(ann);

      const { body } = await call(ann, UPDATE, {
        input: change(entry.id, { endDate: "2027-02-01" }),
      });

      expect(errorOf(body)?.extensions.fieldErrors).toEqual([
        {
          field: "endDate",
          messages: ["End date must be within project duration"],
          reasons: ["END_OUTSIDE_PROJECT"],
        },
      ]);
      const stored = await prisma.cvProject.findUniqueOrThrow({ where: { id: entry.id } });
      expect(stored.startDate).toEqual(new Date("2026-03-01"));
    });

    it("requires at least one role and keeps the old roles (AC-16)", async () => {
      const entry = await addedEntry(ann, { roleIds: [developer] });

      const { body } = await call(ann, UPDATE, { input: change(entry.id, { roleIds: [] }) });

      expect(errorOf(body)?.extensions.fieldErrors).toEqual([
        { field: "roleIds", messages: ["At least one role must be selected"] },
      ]);
      expect(await prisma.cvProjectRole.count({ where: { cvProjectId: entry.id } })).toBe(1);
    });

    it("rejects a role that does not exist (AC-33)", async () => {
      const entry = await addedEntry(ann);

      const { body } = await call(ann, UPDATE, {
        input: change(entry.id, { roleIds: [MISSING_ID] }),
      });

      expect(errorOf(body)?.extensions.code).toBe("BAD_USER_INPUT");
    });

    it("answers NOT_FOUND for an entry in the CV of another user and changes nothing (AC-28, AC-29)", async () => {
      const entry = await addedEntry(ben, { cvId: benCv });

      const { body } = await call(ann, UPDATE, { input: change(entry.id) });

      expect(errorOf(body)?.extensions.code).toBe("NOT_FOUND");
      const stored = await prisma.cvProject.findUniqueOrThrow({ where: { id: entry.id } });
      expect(stored.responsibilities).toBeNull();
    });

    it("answers NOT_FOUND for an entry that does not exist", async () => {
      const { body } = await call(ann, UPDATE, { input: change(MISSING_ID) });

      expect(errorOf(body)?.extensions.code).toBe("NOT_FOUND");
    });

    it("lets an admin update an entry in the CV of another user (AC-30)", async () => {
      const entry = await addedEntry(ann);

      const { body } = await call(admin, UPDATE, { input: change(entry.id) });

      expect(body.errors).toBeUndefined();
    });

    it("refuses an unverified user (D16)", async () => {
      const entry = await prisma.cvProject.create({
        data: { cvId: unverifiedCv, projectId: bank, startDate: new Date("2026-03-01") },
      });

      const { body } = await call(unverified, UPDATE, { input: change(entry.id) });

      expect(errorOf(body)?.extensions.reason).toBe("EMAIL_NOT_VERIFIED");
    });
  });

  describe("removeCvProjects", () => {
    it("removes the entries with their roles and keeps the catalog (AC-22, AC-23, AC-39)", async () => {
      const first = await addedEntry(ann, { roleIds: [developer, tester] });
      const second = await addedEntry(ann, { projectId: shop });

      const { body } = await call(ann, REMOVE, { input: { cvId: annCv, ids: [first.id] } });

      expect(body.data?.["removeCvProjects"]).toBe(true);
      expect((await list(ann, annCv)).entries.map(({ id }) => id)).toEqual([second.id]);
      expect(await prisma.cvProjectRole.count({ where: { cvProjectId: first.id } })).toBe(0);
      expect(await prisma.project.count()).toBe(2);
      expect(await prisma.projectRole.count()).toBe(2);
    });

    it("removes several entries at once", async () => {
      const first = await addedEntry(ann);
      const second = await addedEntry(ann, { projectId: shop });

      await call(ann, REMOVE, { input: { cvId: annCv, ids: [first.id, second.id] } });

      expect(await prisma.cvProject.count()).toBe(0);
    });

    it("removes nothing when one id is not in the named CV", async () => {
      const mine = await addedEntry(ann);
      const other = await addedEntry(ann, { cvId: annOtherCv });

      const { body } = await call(ann, REMOVE, {
        input: { cvId: annCv, ids: [mine.id, other.id] },
      });

      expect(errorOf(body)?.extensions.code).toBe("NOT_FOUND");
      expect(await prisma.cvProject.count()).toBe(2);
    });

    it("answers NOT_FOUND for an id that does not exist", async () => {
      const { body } = await call(ann, REMOVE, { input: { cvId: annCv, ids: [MISSING_ID] } });

      expect(errorOf(body)?.extensions.code).toBe("NOT_FOUND");
    });

    it("answers NOT_FOUND for the CV of another user and removes nothing (AC-28, AC-29)", async () => {
      const entry = await addedEntry(ben, { cvId: benCv });

      const { body } = await call(ann, REMOVE, { input: { cvId: benCv, ids: [entry.id] } });

      expect(errorOf(body)?.extensions.code).toBe("NOT_FOUND");
      expect(await prisma.cvProject.count()).toBe(1);
    });

    it("does not let a user remove an entry of another CV by naming their own CV", async () => {
      const entry = await addedEntry(ben, { cvId: benCv });

      const { body } = await call(ann, REMOVE, { input: { cvId: annCv, ids: [entry.id] } });

      expect(errorOf(body)?.extensions.code).toBe("NOT_FOUND");
      expect(await prisma.cvProject.count()).toBe(1);
    });

    it("lets an admin remove entries from the CV of another user (AC-30)", async () => {
      const entry = await addedEntry(ann);

      const { body } = await call(admin, REMOVE, { input: { cvId: annCv, ids: [entry.id] } });

      expect(body.data?.["removeCvProjects"]).toBe(true);
    });

    it("rejects an empty list of ids", async () => {
      const { body } = await call(ann, REMOVE, { input: { cvId: annCv, ids: [] } });

      expect(errorOf(body)?.extensions.code).toBe("BAD_USER_INPUT");
    });

    it("refuses an unverified user (D16)", async () => {
      const entry = await prisma.cvProject.create({
        data: { cvId: unverifiedCv, projectId: bank, startDate: new Date("2026-03-01") },
      });

      const { body } = await call(unverified, REMOVE, {
        input: { cvId: unverifiedCv, ids: [entry.id] },
      });

      expect(errorOf(body)?.extensions.reason).toBe("EMAIL_NOT_VERIFIED");
      expect(await prisma.cvProject.count()).toBe(1);
    });
  });
});

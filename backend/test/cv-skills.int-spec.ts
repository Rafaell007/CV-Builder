import type { NestExpressApplication } from "@nestjs/platform-express";
import { Role } from "../src/generated/prisma/enums";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp } from "./support/create-test-app";
import { createUser } from "./support/create-user";
import { graphqlRequest, toCookiePair } from "./support/graphql-request";
import type { GraphQLBody } from "./support/graphql-request";

const SIGN_IN = `mutation ($input: SignInInput!) { signIn(input: $input) { id } }`;
const FIELDS = `id cvId skillId name mastery category { id name }`;
const LIST = `query ($cvId: ID!) { cvSkills(cvId: $cvId) { ${FIELDS} } }`;
const AVAILABLE = `query ($cvId: ID!) { availableCvSkills(cvId: $cvId) { id name mastery category { name } } }`;
const ADD = `mutation ($input: AddCvSkillInput!) { addCvSkill(input: $input) { ${FIELDS} } }`;
const UPDATE = `mutation ($input: UpdateCvSkillInput!) { updateCvSkill(input: $input) { ${FIELDS} } }`;
const REMOVE = `mutation ($input: RemoveCvSkillsInput!) { removeCvSkills(input: $input) }`;

const MISSING_ID = "00000000-0000-4000-8000-000000000000";

interface Link {
  id: string;
  cvId: string;
  skillId: string;
  name: string;
  mastery: string;
  category: { name: string };
}

type Who = { id: string; cookie: string };

describe("cv skills", () => {
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
  let react: string;
  let vue: string;
  let node: string;
  let postgres: string;

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

  async function list(who: Who, cvId: string): Promise<Link[]> {
    const { body } = await call(who, LIST, { cvId });
    expect(body.errors).toBeUndefined();
    return body.data?.["cvSkills"] as Link[];
  }

  async function available(who: Who, cvId: string): Promise<string[]> {
    const { body } = await call(who, AVAILABLE, { cvId });
    expect(body.errors).toBeUndefined();
    return (body.data?.["availableCvSkills"] as { name: string }[]).map((skill) => skill.name);
  }

  function add(who: Who, overrides: Record<string, unknown> = {}) {
    return call(who, ADD, { input: { cvId: annCv, skillId: react, ...overrides } });
  }

  async function addedLink(who: Who, overrides: Record<string, unknown> = {}): Promise<Link> {
    const { body } = await add(who, overrides);
    expect(body.errors).toBeUndefined();
    return body.data?.["addCvSkill"] as Link;
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

    const frontend = await prisma.skillCategory.create({
      data: { name: "Frontend", type: "TECH" },
    });
    const backend = await prisma.skillCategory.create({ data: { name: "Backend", type: "TECH" } });
    const skill = async (name: string, categoryId: string) =>
      (await prisma.skill.create({ data: { name, categoryId } })).id;
    react = await skill("React", frontend.id);
    vue = await skill("Vue", frontend.id);
    node = await skill("Node.js", backend.id);
    postgres = await skill("PostgreSQL", backend.id);

    // Ann has React, Vue and Node.js. Ben has only PostgreSQL. The new user has React.
    const ownSkill = (userId: string, skillId: string, mastery: "BEGINNER" | "ADVANCED") =>
      prisma.userSkill.create({ data: { userId, skillId, mastery } });
    await ownSkill(ann.id, react, "ADVANCED");
    await ownSkill(ann.id, vue, "BEGINNER");
    await ownSkill(ann.id, node, "ADVANCED");
    await ownSkill(ben.id, postgres, "ADVANCED");
    await ownSkill(unverified.id, react, "ADVANCED");
  });

  beforeEach(async () => {
    await prisma.cvSkill.deleteMany();
    // Some tests give the admin a skill of their own; the next test starts without it.
    await prisma.userSkill.deleteMany({ where: { userId: admin.id } });
  });

  afterAll(async () => {
    await app.close();
  });

  describe("cvSkills query", () => {
    it("shows the skills of the CV with name, category and mastery", async () => {
      await addedLink(ann);

      const links = await list(ann, annCv);

      expect(links).toHaveLength(1);
      expect(links[0]).toMatchObject({
        cvId: annCv,
        skillId: react,
        name: "React",
        mastery: "ADVANCED",
        category: { name: "Frontend" },
      });
    });

    it("answers an empty list for a CV without skills", async () => {
      expect(await list(ann, annCv)).toEqual([]);
    });

    it("shows only the skills of the selected CV", async () => {
      await addedLink(ann);
      await addedLink(ann, { cvId: annOtherCv, skillId: vue });

      expect((await list(ann, annCv)).map((link) => link.name)).toEqual(["React"]);
      expect((await list(ann, annOtherCv)).map((link) => link.name)).toEqual(["Vue"]);
    });

    it("orders by category name, then by skill name", async () => {
      await addedLink(ann, { skillId: vue });
      await addedLink(ann, { skillId: node });
      await addedLink(ann, { skillId: react });

      expect((await list(ann, annCv)).map((link) => link.name)).toEqual([
        "Node.js",
        "React",
        "Vue",
      ]);
    });

    it("lets an admin read the skills of the CV of another user", async () => {
      await addedLink(ann);

      expect((await list(admin, annCv)).map((link) => link.name)).toEqual(["React"]);
    });

    it("answers NOT_FOUND for the CV of another user, like for a missing CV (AC-3, AC-38)", async () => {
      await addedLink(ann);

      const other = await call(ben, LIST, { cvId: annCv });
      const missing = await call(ben, LIST, { cvId: MISSING_ID });

      expect(errorOf(other.body)?.extensions.code).toBe("NOT_FOUND");
      expect(errorOf(missing.body)?.extensions.code).toBe("NOT_FOUND");
      expect(errorOf(other.body)?.message).toBe(errorOf(missing.body)?.message);
    });

    it("refuses a request without a session", async () => {
      const { body } = await call(null, LIST, { cvId: annCv });

      expect(errorOf(body)?.extensions.code).toBe("UNAUTHENTICATED");
    });

    it("refuses an id that is not a UUID", async () => {
      const { body } = await call(ann, LIST, { cvId: "not-a-uuid" });

      expect(errorOf(body)?.extensions.code).toBe("BAD_USER_INPUT");
    });
  });

  describe("availableCvSkills query", () => {
    it("lists the skills of the owner, with the owner's mastery (AC-15)", async () => {
      const { body } = await call(ann, AVAILABLE, { cvId: annCv });

      expect(body.data?.["availableCvSkills"]).toEqual([
        { id: node, name: "Node.js", mastery: "ADVANCED", category: { name: "Backend" } },
        { id: react, name: "React", mastery: "ADVANCED", category: { name: "Frontend" } },
        { id: vue, name: "Vue", mastery: "BEGINNER", category: { name: "Frontend" } },
      ]);
    });

    it("leaves out the skills that are already in the CV (AC-16)", async () => {
      await addedLink(ann);

      expect(await available(ann, annCv)).toEqual(["Node.js", "Vue"]);
      // The other CV of the same owner is not affected.
      expect(await available(ann, annOtherCv)).toEqual(["Node.js", "React", "Vue"]);
    });

    it("lists the skills of the owner, not the skills of the admin who asks", async () => {
      await ownSkillOf(admin, postgres);

      expect(await available(admin, annCv)).toEqual(["Node.js", "React", "Vue"]);
    });

    it("answers NOT_FOUND for the CV of another user", async () => {
      const { body } = await call(ben, AVAILABLE, { cvId: annCv });

      expect(errorOf(body)?.extensions.code).toBe("NOT_FOUND");
    });

    async function ownSkillOf(who: Who, skillId: string) {
      await prisma.userSkill.create({ data: { userId: who.id, skillId, mastery: "EXPERT" } });
    }
  });

  describe("addCvSkill mutation", () => {
    it("adds a skill with the mastery of the owner when none is sent (AC-19, AC-20)", async () => {
      const link = await addedLink(ann, { skillId: vue });

      expect(link).toMatchObject({ cvId: annCv, name: "Vue", mastery: "BEGINNER" });
      expect(await prisma.cvSkill.count({ where: { cvId: annCv } })).toBe(1);
    });

    it("uses the mastery from the request when one is sent", async () => {
      const link = await addedLink(ann, { skillId: vue, mastery: "EXPERT" });

      expect(link.mastery).toBe("EXPERT");
    });

    it("lets an admin add a skill of the owner to the CV of another user", async () => {
      const link = await addedLink(admin);

      expect(link).toMatchObject({ cvId: annCv, name: "React" });
    });

    it("refuses a skill that the owner does not have, with a field error (AC-18)", async () => {
      const { body } = await add(ann, { skillId: postgres });

      expect(errorOf(body)?.extensions.code).toBe("BAD_USER_INPUT");
      expect(JSON.stringify(errorOf(body)?.extensions)).toContain("skillId");
      expect(await prisma.cvSkill.count()).toBe(0);
    });

    it("refuses an admin who names a skill of the admin but not of the owner", async () => {
      await prisma.userSkill.create({
        data: { userId: admin.id, skillId: postgres, mastery: "EXPERT" },
      });

      const { body } = await add(admin, { skillId: postgres });

      expect(errorOf(body)?.extensions.code).toBe("BAD_USER_INPUT");
      expect(await prisma.cvSkill.count()).toBe(0);
    });

    it("refuses a skill that does not exist", async () => {
      const { body } = await add(ann, { skillId: MISSING_ID });

      expect(errorOf(body)?.extensions.code).toBe("BAD_USER_INPUT");
    });

    it("refuses the same skill twice with CONFLICT (AC-37)", async () => {
      await addedLink(ann);

      const { body } = await add(ann);

      expect(errorOf(body)?.extensions.code).toBe("CONFLICT");
      expect(await prisma.cvSkill.count({ where: { cvId: annCv } })).toBe(1);
    });

    it("gives one link and one CONFLICT for two parallel requests", async () => {
      const results = await Promise.all([add(ann), add(ann)]);

      const codes = results.map(({ body }) => errorOf(body)?.extensions.code);
      expect(codes.filter((code) => code === undefined)).toHaveLength(1);
      expect(codes.filter((code) => code === "CONFLICT")).toHaveLength(1);
      expect(await prisma.cvSkill.count({ where: { cvId: annCv } })).toBe(1);
    });

    it("allows the same skill in two CVs of the owner", async () => {
      await addedLink(ann);

      await addedLink(ann, { cvId: annOtherCv });

      expect(await prisma.cvSkill.count()).toBe(2);
    });

    it("answers NOT_FOUND for the CV of another user and adds nothing (AC-38)", async () => {
      const { body } = await add(ben, { cvId: annCv, skillId: postgres });

      expect(errorOf(body)?.extensions.code).toBe("NOT_FOUND");
      expect(await prisma.cvSkill.count()).toBe(0);
    });

    it("requires a verified email (D16)", async () => {
      const { body } = await add(unverified, { cvId: unverifiedCv });

      expect(errorOf(body)?.extensions.code).toBe("FORBIDDEN");
      expect(await prisma.cvSkill.count()).toBe(0);
    });
  });

  describe("updateCvSkill mutation", () => {
    it("changes the mastery of the link only for this CV (AC-25)", async () => {
      const link = await addedLink(ann);
      const other = await addedLink(ann, { cvId: annOtherCv });

      const { body } = await call(ann, UPDATE, { input: { id: link.id, mastery: "BEGINNER" } });

      expect(body.errors).toBeUndefined();
      expect((body.data?.["updateCvSkill"] as Link).mastery).toBe("BEGINNER");
      expect((await list(ann, annOtherCv))[0]?.mastery).toBe(other.mastery);
      // The mastery of the owner does not change.
      const own = await prisma.userSkill.findFirstOrThrow({
        where: { userId: ann.id, skillId: react },
      });
      expect(own.mastery).toBe("ADVANCED");
    });

    it("lets an admin change the link in the CV of another user", async () => {
      const link = await addedLink(ann);

      const { body } = await call(admin, UPDATE, { input: { id: link.id, mastery: "EXPERT" } });

      expect(body.errors).toBeUndefined();
    });

    it("answers NOT_FOUND for the link in the CV of another user and changes nothing", async () => {
      const link = await addedLink(ann);

      const { body } = await call(ben, UPDATE, { input: { id: link.id, mastery: "EXPERT" } });

      expect(errorOf(body)?.extensions.code).toBe("NOT_FOUND");
      expect((await list(ann, annCv))[0]?.mastery).toBe("ADVANCED");
    });

    it("answers NOT_FOUND for a link that does not exist", async () => {
      const { body } = await call(ann, UPDATE, { input: { id: MISSING_ID, mastery: "EXPERT" } });

      expect(errorOf(body)?.extensions.code).toBe("NOT_FOUND");
    });

    it("requires a verified email (D16)", async () => {
      const link = await prisma.cvSkill.create({
        data: { cvId: unverifiedCv, skillId: react, mastery: "ADVANCED" },
      });

      const { body } = await call(unverified, UPDATE, {
        input: { id: link.id, mastery: "EXPERT" },
      });

      expect(errorOf(body)?.extensions.code).toBe("FORBIDDEN");
    });
  });

  describe("removeCvSkills mutation", () => {
    it("removes several links and keeps the skills of the catalog and of the owner (AC-34, AC-36)", async () => {
      const first = await addedLink(ann);
      const second = await addedLink(ann, { skillId: vue });
      await addedLink(ann, { skillId: node });

      const { body } = await call(ann, REMOVE, {
        input: { cvId: annCv, ids: [first.id, second.id] },
      });

      expect(body.data?.["removeCvSkills"]).toBe(true);
      expect((await list(ann, annCv)).map((link) => link.name)).toEqual(["Node.js"]);
      expect(await prisma.skill.count()).toBe(4);
      expect(await prisma.userSkill.count({ where: { userId: ann.id } })).toBe(3);
    });

    it("makes the skill available again", async () => {
      const link = await addedLink(ann);

      await call(ann, REMOVE, { input: { cvId: annCv, ids: [link.id] } });

      expect(await available(ann, annCv)).toContain("React");
    });

    it("removes nothing when one id is not in the CV (AC-33)", async () => {
      const link = await addedLink(ann);
      const foreign = await addedLink(ann, { cvId: annOtherCv });

      const { body } = await call(ann, REMOVE, {
        input: { cvId: annCv, ids: [link.id, foreign.id] },
      });

      expect(errorOf(body)?.extensions.code).toBe("NOT_FOUND");
      expect(await prisma.cvSkill.count()).toBe(2);
    });

    it("answers NOT_FOUND for the CV of another user and removes nothing (AC-38)", async () => {
      const link = await addedLink(ann);

      const { body } = await call(ben, REMOVE, { input: { cvId: annCv, ids: [link.id] } });

      expect(errorOf(body)?.extensions.code).toBe("NOT_FOUND");
      expect(await prisma.cvSkill.count()).toBe(1);
    });

    it("does not let a user remove a link of another CV by naming their own CV", async () => {
      const link = await addedLink(ann);
      await prisma.userSkill.create({
        data: { userId: ben.id, skillId: react, mastery: "BEGINNER" },
      });

      const { body } = await call(ben, REMOVE, { input: { cvId: benCv, ids: [link.id] } });

      expect(errorOf(body)?.extensions.code).toBe("NOT_FOUND");
      expect(await prisma.cvSkill.count()).toBe(1);
    });

    it("refuses an empty list of ids", async () => {
      const { body } = await call(ann, REMOVE, { input: { cvId: annCv, ids: [] } });

      expect(errorOf(body)?.extensions.code).toBe("BAD_USER_INPUT");
    });

    it("requires a verified email (D16)", async () => {
      const { body } = await call(unverified, REMOVE, {
        input: { cvId: unverifiedCv, ids: [MISSING_ID] },
      });

      expect(errorOf(body)?.extensions.code).toBe("FORBIDDEN");
    });
  });

  describe("deleting a CV", () => {
    it("removes its links and keeps the skills (AC-36)", async () => {
      await addedLink(ann);

      await prisma.cv.delete({ where: { id: annCv } });

      expect(await prisma.cvSkill.count()).toBe(0);
      expect(await prisma.skill.count()).toBe(4);
      annCv = await prisma.cv
        .create({
          data: { userId: ann.id, name: "Ann Backend", education: "MSc", description: "Text" },
        })
        .then((cv) => cv.id);
    });
  });
});

import type { NestExpressApplication } from "@nestjs/platform-express";
import { Role } from "../../src/generated/prisma/enums";
import { PrismaService } from "../../src/prisma/prisma.service";
import { createTestApp } from "../support/create-test-app";
import { createUser } from "../support/create-user";
import { graphqlRequest, toCookiePair } from "../support/graphql-request";
import type { GraphQLBody } from "../support/graphql-request";

const SIGN_IN = `mutation ($input: SignInInput!) { signIn(input: $input) { id } }`;
const FIELDS = `id userId skillId name mastery category { id name }`;
const LIST = `query ($userId: ID!) { userSkills(userId: $userId) { ${FIELDS} } }`;
const ADD = `mutation ($input: AddUserSkillInput!) { addUserSkill(input: $input) { ${FIELDS} } }`;
const UPDATE = `mutation ($input: UpdateUserSkillInput!) { updateUserSkill(input: $input) { ${FIELDS} } }`;
const REMOVE = `mutation ($input: RemoveUserSkillsInput!) { removeUserSkills(input: $input) }`;

const MISSING_ID = "00000000-0000-4000-8000-000000000000";

interface Link {
  id: string;
  userId: string;
  skillId: string;
  name: string;
  mastery: string;
  category: { name: string };
}

type Who = { id: string; cookie: string };

describe("user skills", () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let admin: Who;
  let ann: Who;
  let ben: Who;
  let unverified: Who;
  let annCv: string;
  let annOtherCv: string;
  let benCv: string;
  let react: string;
  let vue: string;
  let node: string;

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

  function errorOf(body: GraphQLBody) {
    return body.errors?.[0];
  }

  async function list(who: Who, userId: string): Promise<Link[]> {
    const { body } = await call(who, LIST, { userId });
    expect(body.errors).toBeUndefined();
    return body.data?.["userSkills"] as Link[];
  }

  function add(who: Who, overrides: Record<string, unknown> = {}) {
    return call(who, ADD, {
      input: { userId: ann.id, skillId: react, mastery: "ADVANCED", ...overrides },
    });
  }

  async function addedLink(who: Who, overrides: Record<string, unknown> = {}): Promise<Link> {
    const { body } = await add(who, overrides);
    expect(body.errors).toBeUndefined();
    return body.data?.["addUserSkill"] as Link;
  }

  function cvSkillNames(cvId: string): Promise<string[]> {
    return prisma.cvSkill
      .findMany({ where: { cvId }, select: { skill: { select: { name: true } } } })
      .then((rows) => rows.map((row) => row.skill.name).sort());
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

    const frontend = await prisma.skillCategory.create({
      data: { name: "Frontend", type: "TECH" },
    });
    const backend = await prisma.skillCategory.create({ data: { name: "Backend", type: "TECH" } });
    const skill = async (name: string, categoryId: string) =>
      (await prisma.skill.create({ data: { name, categoryId } })).id;
    react = await skill("React", frontend.id);
    vue = await skill("Vue", frontend.id);
    node = await skill("Node.js", backend.id);
  });

  beforeEach(async () => {
    await prisma.cvSkill.deleteMany();
    await prisma.userSkill.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("userSkills query", () => {
    it("lists the user's skills flat, sorted by category and then name", async () => {
      await addedLink(ann, { skillId: vue });
      await addedLink(ann, { skillId: react });
      await addedLink(ann, { skillId: node, mastery: "EXPERT" });

      const links = await list(ann, ann.id);

      expect(links.map((link) => [link.category.name, link.name])).toEqual([
        ["Backend", "Node.js"],
        ["Frontend", "React"],
        ["Frontend", "Vue"],
      ]);
      expect(links[0]).toMatchObject({ userId: ann.id, skillId: node, mastery: "EXPERT" });
    });

    it("shows only the skills of the requested user", async () => {
      await addedLink(ann);
      await addedLink(ben, { userId: ben.id, skillId: vue });

      expect((await list(ann, ann.id)).map((link) => link.name)).toEqual(["React"]);
    });

    it("lets any signed-in user read another user's skills (user skills page)", async () => {
      await addedLink(ann);

      expect(await list(ben, ann.id)).toHaveLength(1);
      expect(await list(unverified, ann.id)).toHaveLength(1);
    });

    it("answers NOT_FOUND for an unknown user and BAD_USER_INPUT for an id that is not a UUID", async () => {
      const missing = await call(ann, LIST, { userId: MISSING_ID });
      const invalid = await call(ann, LIST, { userId: "abc" });

      expect(errorOf(missing.body)?.extensions.code).toBe("NOT_FOUND");
      expect(errorOf(invalid.body)?.extensions.code).toBe("BAD_USER_INPUT");
    });

    it("needs a session", async () => {
      const { body } = await call(null, LIST, { userId: ann.id });

      expect(errorOf(body)?.extensions.code).toBe("UNAUTHENTICATED");
    });
  });

  describe("addUserSkill", () => {
    it("lets the owner add a skill and stores it", async () => {
      const link = await addedLink(ann);

      expect(link).toMatchObject({
        userId: ann.id,
        skillId: react,
        name: "React",
        mastery: "ADVANCED",
        category: { name: "Frontend" },
      });
      expect(await prisma.userSkill.count({ where: { userId: ann.id } })).toBe(1);
    });

    it("lets an admin add a skill to another user", async () => {
      const link = await addedLink(admin);

      expect(link.userId).toBe(ann.id);
    });

    it("refuses another user as FORBIDDEN, also for an unknown user id", async () => {
      const other = await add(ben);
      const missing = await add(ben, { userId: MISSING_ID });

      expect(errorOf(other.body)?.extensions.code).toBe("FORBIDDEN");
      expect(errorOf(missing.body)?.extensions.code).toBe("FORBIDDEN");
      expect(await prisma.userSkill.count()).toBe(0);
    });

    it("answers NOT_FOUND to an admin for an unknown user", async () => {
      const { body } = await add(admin, { userId: MISSING_ID });

      expect(errorOf(body)?.extensions.code).toBe("NOT_FOUND");
    });

    it("requires a verified email (D16)", async () => {
      const { body } = await add(unverified, { userId: unverified.id });

      expect(errorOf(body)?.extensions.code).toBe("FORBIDDEN");
      expect(errorOf(body)?.extensions.reason).toBe("EMAIL_NOT_VERIFIED");
    });

    it("answers BAD_USER_INPUT on skillId for a skill that is not in the catalog", async () => {
      const { body } = await add(ann, { skillId: MISSING_ID });

      expect(errorOf(body)?.extensions.code).toBe("BAD_USER_INPUT");
      expect(errorOf(body)?.extensions.fieldErrors).toEqual([
        { field: "skillId", messages: ["Skill not found"] },
      ]);
    });

    // A value outside the GraphQL enum never reaches the backend code: GraphQL refuses it first.
    it("refuses NONE, which exists only for the skills of a CV", async () => {
      const { body } = await add(ann, { mastery: "NONE" });

      expect(errorOf(body)?.extensions.code).toBe("BAD_USER_INPUT");
      expect(JSON.stringify(errorOf(body)?.extensions)).toContain("mastery");
      expect(await prisma.userSkill.count()).toBe(0);
    });

    it("answers CONFLICT when the user already has the skill", async () => {
      await addedLink(ann);

      const { body } = await add(ann);

      expect(errorOf(body)?.extensions.code).toBe("CONFLICT");
      expect(await prisma.userSkill.count({ where: { userId: ann.id } })).toBe(1);
    });

    it("gives one link and one CONFLICT for two parallel requests", async () => {
      const results = await Promise.all([add(ann), add(admin)]);

      const codes = results.map(({ body }) => errorOf(body)?.extensions.code);
      expect(codes.filter((code) => code === undefined)).toHaveLength(1);
      expect(codes.filter((code) => code === "CONFLICT")).toHaveLength(1);
      expect(await prisma.userSkill.count({ where: { userId: ann.id } })).toBe(1);
    });
  });

  describe("updateUserSkill", () => {
    it("lets the owner and an admin change the mastery", async () => {
      const link = await addedLink(ann);

      const byOwner = await call(ann, UPDATE, { input: { id: link.id, mastery: "EXPERT" } });
      const byAdmin = await call(admin, UPDATE, { input: { id: link.id, mastery: "BEGINNER" } });

      expect(byOwner.body.data?.["updateUserSkill"]).toMatchObject({ mastery: "EXPERT" });
      expect(byAdmin.body.data?.["updateUserSkill"]).toMatchObject({ mastery: "BEGINNER" });
      expect((await prisma.userSkill.findUniqueOrThrow({ where: { id: link.id } })).mastery).toBe(
        "BEGINNER",
      );
    });

    it("refuses another user as FORBIDDEN and keeps the mastery", async () => {
      const link = await addedLink(ann);

      const { body } = await call(ben, UPDATE, { input: { id: link.id, mastery: "EXPERT" } });

      expect(errorOf(body)?.extensions.code).toBe("FORBIDDEN");
      expect((await prisma.userSkill.findUniqueOrThrow({ where: { id: link.id } })).mastery).toBe(
        "ADVANCED",
      );
    });

    it("answers FORBIDDEN, not NOT_FOUND, to a user who sends an unknown link", async () => {
      const { body } = await call(ben, UPDATE, { input: { id: MISSING_ID, mastery: "EXPERT" } });

      expect(errorOf(body)?.extensions.code).toBe("FORBIDDEN");
    });

    it("answers NOT_FOUND to an admin for an unknown link and BAD_USER_INPUT for NONE", async () => {
      const link = await addedLink(ann);

      const missing = await call(admin, UPDATE, { input: { id: MISSING_ID, mastery: "EXPERT" } });
      const none = await call(ann, UPDATE, { input: { id: link.id, mastery: "NONE" } });

      expect(errorOf(missing.body)?.extensions.code).toBe("NOT_FOUND");
      expect(errorOf(none.body)?.extensions.code).toBe("BAD_USER_INPUT");
    });

    it("does not change the skill of a CV (the CV keeps its own mastery)", async () => {
      const link = await addedLink(ann);
      await prisma.cvSkill.create({ data: { cvId: annCv, skillId: react, mastery: "ADVANCED" } });

      await call(ann, UPDATE, { input: { id: link.id, mastery: "EXPERT" } });

      const cvSkill = await prisma.cvSkill.findFirstOrThrow({ where: { cvId: annCv } });
      expect(cvSkill.mastery).toBe("ADVANCED");
    });
  });

  describe("removeUserSkills", () => {
    async function giveAnnSkillsInCvs(): Promise<Link[]> {
      const links = [
        await addedLink(ann, { skillId: react }),
        await addedLink(ann, { skillId: vue }),
        await addedLink(ann, { skillId: node }),
      ];
      await addedLink(ben, { userId: ben.id, skillId: react });
      await prisma.cvSkill.createMany({
        data: [
          { cvId: annCv, skillId: react, mastery: "ADVANCED" },
          { cvId: annCv, skillId: node, mastery: "ADVANCED" },
          { cvId: annOtherCv, skillId: react, mastery: "EXPERT" },
          { cvId: annOtherCv, skillId: vue, mastery: "BEGINNER" },
          { cvId: benCv, skillId: react, mastery: "ADVANCED" },
        ],
      });
      return links;
    }

    it("removes the skills from the user and from all the user's CVs (D13)", async () => {
      const [reactLink, vueLink] = await giveAnnSkillsInCvs();

      const { body } = await call(ann, REMOVE, {
        input: { userId: ann.id, ids: [reactLink!.id, vueLink!.id] },
      });

      expect(body.data?.["removeUserSkills"]).toBe(true);
      expect((await list(ann, ann.id)).map((link) => link.name)).toEqual(["Node.js"]);
      expect(await cvSkillNames(annCv)).toEqual(["Node.js"]);
      expect(await cvSkillNames(annOtherCv)).toEqual([]);
    });

    it("keeps the same skill of other users and their CVs, and the catalog skill", async () => {
      const [reactLink] = await giveAnnSkillsInCvs();

      await call(ann, REMOVE, { input: { userId: ann.id, ids: [reactLink!.id] } });

      expect((await list(ben, ben.id)).map((link) => link.name)).toEqual(["React"]);
      expect(await cvSkillNames(benCv)).toEqual(["React"]);
      expect(await prisma.skill.count({ where: { id: react } })).toBe(1);
    });

    it("lets an admin remove the skills of another user", async () => {
      const [reactLink] = await giveAnnSkillsInCvs();

      const { body } = await call(admin, REMOVE, {
        input: { userId: ann.id, ids: [reactLink!.id] },
      });

      expect(body.data?.["removeUserSkills"]).toBe(true);
      expect(await list(ann, ann.id)).toHaveLength(2);
    });

    it("refuses another user as FORBIDDEN and removes nothing", async () => {
      const [reactLink] = await giveAnnSkillsInCvs();

      const { body } = await call(ben, REMOVE, {
        input: { userId: ann.id, ids: [reactLink!.id] },
      });

      expect(errorOf(body)?.extensions.code).toBe("FORBIDDEN");
      expect(await list(ann, ann.id)).toHaveLength(3);
      expect(await cvSkillNames(annCv)).toEqual(["Node.js", "React"]);
    });

    it("removes nothing when one id belongs to another user or does not exist", async () => {
      const [reactLink] = await giveAnnSkillsInCvs();
      const benLink = (await list(ben, ben.id))[0]!;

      const foreign = await call(ann, REMOVE, {
        input: { userId: ann.id, ids: [reactLink!.id, benLink.id] },
      });
      const missing = await call(ann, REMOVE, {
        input: { userId: ann.id, ids: [reactLink!.id, MISSING_ID] },
      });

      expect(errorOf(foreign.body)?.extensions.code).toBe("NOT_FOUND");
      expect(errorOf(missing.body)?.extensions.code).toBe("NOT_FOUND");
      expect(await list(ann, ann.id)).toHaveLength(3);
      expect(await list(ben, ben.id)).toHaveLength(1);
      expect(await cvSkillNames(annCv)).toEqual(["Node.js", "React"]);
    });

    it("requires a verified email (D16)", async () => {
      const { body } = await call(unverified, REMOVE, {
        input: { userId: unverified.id, ids: [MISSING_ID] },
      });

      expect(errorOf(body)?.extensions.code).toBe("FORBIDDEN");
      expect(errorOf(body)?.extensions.reason).toBe("EMAIL_NOT_VERIFIED");
    });
  });
});

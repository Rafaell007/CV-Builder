import type { NestExpressApplication } from "@nestjs/platform-express";
import { Role } from "../../src/generated/prisma/enums";
import { PrismaService } from "../../src/prisma/prisma.service";
import { createTestApp } from "../support/create-test-app";
import { createUser } from "../support/create-user";
import { graphqlRequest, toCookiePair } from "../support/graphql-request";
import type { GraphQLBody } from "../support/graphql-request";

const SIGN_IN = `mutation ($input: SignInInput!) { signIn(input: $input) { id } }`;
const PREVIEW = `query ($cvId: ID!) {
  cvPreview(cvId: $cvId) {
    cvId name education description fullName position domains
    languages { name proficiency }
    skillGroups { category skills { name mastery experienceYears lastUsedYear } }
    projects {
      name description domain environment roles period startDate endDate responsibilities
    }
  }
}`;

const MISSING_ID = "00000000-0000-4000-8000-000000000000";

interface Preview {
  cvId: string;
  name: string;
  education: string;
  description: string;
  fullName: string | null;
  position: string | null;
  domains: string[];
  languages: { name: string; proficiency: string }[];
  skillGroups: {
    category: string;
    skills: {
      name: string;
      mastery: string;
      experienceYears: number | null;
      lastUsedYear: number | null;
    }[];
  }[];
  projects: {
    name: string;
    description: string;
    domain: string;
    environment: string[];
    roles: string[];
    period: string;
    startDate: string;
    endDate: string | null;
    responsibilities: string | null;
  }[];
}

type Who = { id: string; cookie: string };

/** The years in the fixtures follow the real current year, because the app reads the real clock. */
const YEAR = new Date().getUTCFullYear();
/** A date on the first day of January, so the years of experience never wait for an anniversary. */
const jan1 = (year: number) => new Date(Date.UTC(year, 0, 1));
const day = (year: number, month: number, date: number) =>
  new Date(Date.UTC(year, month - 1, date));

describe("cv preview", () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let admin: Who;
  let ann: Who;
  let ben: Who;
  let annCv: string;
  let annOtherCv: string;
  let benCv: string;

  async function addUser(email: string, role: Role = Role.USER): Promise<Who> {
    const user = await createUser(app, { email, role });
    const { setCookies } = await graphqlRequest(app, SIGN_IN, {
      variables: { input: { email, password: "Password123!" } },
    });
    const access = setCookies.find((cookie) => cookie.startsWith("access_token="));
    return { id: user.id, cookie: toCookiePair(access ?? "") };
  }

  function call(who: Who | null, cvId: string) {
    return graphqlRequest(app, PREVIEW, { cookies: who ? [who.cookie] : [], variables: { cvId } });
  }

  async function preview(who: Who, cvId: string): Promise<Preview> {
    const { body } = await call(who, cvId);
    expect(body.errors).toBeUndefined();
    return body.data?.["cvPreview"] as Preview;
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

    const engineer = await prisma.position.create({ data: { name: "Software Engineer" } });
    await prisma.user.update({
      where: { id: ann.id },
      data: { firstName: "Ann", lastName: "Kowalska", positionId: engineer.id },
    });
    const language = async (name: string, iso: string, proficiency: "B2" | "C1" | "NATIVE") => {
      const { id } = await prisma.language.create({ data: { name, iso, nativeName: name } });
      await prisma.userLanguage.create({ data: { userId: ann.id, languageId: id, proficiency } });
    };
    await language("Polish", "pl", "NATIVE");
    await language("English", "en", "C1");

    const cv = async (userId: string, name: string, education = "MSc", description = "Text") =>
      (await prisma.cv.create({ data: { userId, name, education, description } })).id;
    annCv = await cv(ann.id, "Ann Frontend", "MSc Computer Science", "Frontend developer");
    annOtherCv = await cv(ann.id, "Ann Other");
    benCv = await cv(ben.id, "Ben Backend");

    const frontend = await prisma.skillCategory.create({
      data: { name: "Frontend", type: "TECH" },
    });
    const backend = await prisma.skillCategory.create({ data: { name: "Backend", type: "TECH" } });
    const skill = async (name: string, categoryId: string) =>
      (await prisma.skill.create({ data: { name, categoryId } })).id;
    const react = await skill("React", frontend.id);
    const javascript = await skill("JavaScript", frontend.id);
    const typescript = await skill("TypeScript", frontend.id);
    const angular = await skill("Angular", frontend.id);
    const node = await skill("Node.js", backend.id);
    // Vue is a skill of Ann that is not in the CV, so the preview must not show it.
    const vue = await skill("Vue", frontend.id);

    const cvSkill = (cvId: string, skillId: string, mastery: "ADVANCED" | "EXPERT" | "BEGINNER") =>
      prisma.cvSkill.create({ data: { cvId, skillId, mastery } });
    await cvSkill(annCv, typescript, "EXPERT");
    await cvSkill(annCv, react, "ADVANCED");
    await cvSkill(annCv, node, "ADVANCED");
    await cvSkill(annCv, javascript, "EXPERT");
    await cvSkill(annCv, angular, "BEGINNER");
    await prisma.userSkill.create({ data: { userId: ann.id, skillId: vue, mastery: "BEGINNER" } });
    await cvSkill(annOtherCv, vue, "BEGINNER");

    const role = async (name: string) => (await prisma.projectRole.create({ data: { name } })).id;
    const developer = await role("Developer");
    const tester = await role("Tester");

    const project = async (name: string, domain: string, skillIds: string[]) =>
      (
        await prisma.project.create({
          data: {
            name,
            domain,
            description: `${name} description`,
            startDate: jan1(YEAR - 12),
            endDate: jan1(YEAR + 5),
            skills: { create: skillIds.map((skillId) => ({ skillId })) },
          },
        })
      ).id;
    const bank = await project("Bank App", "Finance", [react, javascript]);
    const shop = await project("Web Shop", "Retail", [typescript, node]);
    const oldBank = await project("Old Bank", "Finance", [react]);
    const clinic = await project("Clinic", "Health", [react, vue]);

    const entry = (data: {
      cvId: string;
      projectId: string;
      startDate: Date;
      endDate?: Date;
      responsibilities?: string;
      roleIds?: string[];
    }) => {
      const { roleIds = [], ...rest } = data;
      return prisma.cvProject.create({
        data: { ...rest, roles: { create: roleIds.map((roleId) => ({ roleId })) } },
      });
    };
    await entry({
      cvId: annCv,
      projectId: bank,
      startDate: jan1(YEAR - 4),
      endDate: day(YEAR - 2, 6, 30),
      responsibilities: "Built the API",
      roleIds: [tester, developer],
    });
    // No end date, no responsibilities, no roles.
    await entry({ cvId: annCv, projectId: shop, startDate: jan1(YEAR - 3) });
    // Same domain as Bank App: the preview lists it once.
    await entry({
      cvId: annCv,
      projectId: oldBank,
      startDate: jan1(YEAR - 1),
      endDate: day(YEAR - 1, 3, 31),
      roleIds: [developer],
    });
    // Another CV of the same owner, with an older React project. It must change nothing in annCv.
    await entry({
      cvId: annOtherCv,
      projectId: clinic,
      startDate: jan1(YEAR - 10),
      endDate: jan1(YEAR - 9),
      roleIds: [developer],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe("the data of the owner", () => {
    it("gives the full preview to the owner", async () => {
      const result = await preview(ann, annCv);

      expect(result).toMatchObject({
        cvId: annCv,
        name: "Ann Frontend",
        education: "MSc Computer Science",
        description: "Frontend developer",
        fullName: "Ann Kowalska",
        position: "Software Engineer",
      });
      expect(result.languages).toEqual([
        { name: "English", proficiency: "C1" },
        { name: "Polish", proficiency: "NATIVE" },
      ]);
      expect(result.skillGroups.map((group) => group.category)).toEqual(["Backend", "Frontend"]);
      expect(result.projects.map((project) => project.name)).toEqual([
        "Old Bank",
        "Web Shop",
        "Bank App",
      ]);
    });
  });

  describe("access", () => {
    it("lets an admin read the preview of the CV of another user", async () => {
      const result = await preview(admin, annCv);

      expect(result).toMatchObject({ cvId: annCv, fullName: "Ann Kowalska" });
      expect(result.projects).toHaveLength(3);
    });

    it("answers NOT_FOUND for the CV of another user, like for a missing CV (AC-23, AC-31)", async () => {
      const other = await call(ben, annCv);
      const missing = await call(ben, MISSING_ID);

      expect(errorOf(other.body)?.extensions.code).toBe("NOT_FOUND");
      expect(errorOf(missing.body)?.extensions.code).toBe("NOT_FOUND");
      expect(errorOf(other.body)?.message).toBe(errorOf(missing.body)?.message);
      expect(other.body.data).toBeNull();
    });

    it("answers NOT_FOUND for an unknown id, also for the owner", async () => {
      const { body } = await call(ann, MISSING_ID);

      expect(errorOf(body)?.extensions.code).toBe("NOT_FOUND");
    });

    it("lets the owner of an empty CV read it", async () => {
      const result = await preview(ben, benCv);

      expect(result).toMatchObject({
        cvId: benCv,
        fullName: null,
        position: null,
        languages: [],
        domains: [],
        skillGroups: [],
        projects: [],
      });
    });

    it("answers BAD_USER_INPUT for an id that is not a UUID", async () => {
      const { body } = await call(ann, "not-a-uuid");

      expect(errorOf(body)?.extensions.code).toBe("BAD_USER_INPUT");
    });

    it("refuses a request without a session", async () => {
      const { body } = await call(null, annCv);

      expect(errorOf(body)?.extensions.code).toBe("UNAUTHENTICATED");
    });
  });

  // CASES-DATA
  // CASES-CALCULATION
});

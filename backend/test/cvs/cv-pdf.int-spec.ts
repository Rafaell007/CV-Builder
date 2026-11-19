import type { NestExpressApplication } from "@nestjs/platform-express";
import { Role } from "../../src/generated/prisma/enums";
import { PrismaService } from "../../src/prisma/prisma.service";
import { createTestApp } from "../support/create-test-app";
import { createUser } from "../support/create-user";
import { graphqlRequest, toCookiePair } from "../support/graphql-request";

const SIGN_IN = `mutation ($input: SignInInput!) { signIn(input: $input) { id } }`;
const EXPORT = `query ($cvId: ID!) { exportCvPdf(cvId: $cvId) { fileName base64 } }`;

const MISSING_ID = "00000000-0000-4000-8000-000000000000";

type Who = { id: string; cookie: string };

describe("cv pdf export", () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let admin: Who;
  let ann: Who;
  let ben: Who;
  let annCv: string;
  let emptyCv: string;

  async function addUser(email: string, role: Role = Role.USER): Promise<Who> {
    const user = await createUser(app, { email, role });
    const { setCookies } = await graphqlRequest(app, SIGN_IN, {
      variables: { input: { email, password: "Password123!" } },
    });
    const access = setCookies.find((cookie) => cookie.startsWith("access_token="));
    return { id: user.id, cookie: toCookiePair(access ?? "") };
  }

  function call(who: Who | null, cvId: string) {
    return graphqlRequest(app, EXPORT, { cookies: who ? [who.cookie] : [], variables: { cvId } });
  }

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    admin = await addUser("admin@example.com", Role.ADMIN);
    ann = await addUser("ann@example.com");
    ben = await addUser("ben@example.com");

    await prisma.user.update({
      where: { id: ann.id },
      data: { firstName: "Анна", lastName: "Kowalska" },
    });
    // The CV name and the content have Cyrillic letters, so the file name and the font are tested too.
    annCv = (
      await prisma.cv.create({
        data: {
          userId: ann.id,
          name: "Разработчик Frontend",
          education: "Магистр",
          description: "Опыт работы",
        },
      })
    ).id;
    emptyCv = (
      await prisma.cv.create({
        data: { userId: ben.id, name: "Empty", education: "", description: "" },
      })
    ).id;

    const category = await prisma.skillCategory.create({
      data: { name: "Frontend", type: "TECH" },
    });
    const react = await prisma.skill.create({ data: { name: "React", categoryId: category.id } });
    await prisma.cvSkill.create({ data: { cvId: annCv, skillId: react.id, mastery: "ADVANCED" } });
    const project = await prisma.project.create({
      data: {
        name: "Магазин",
        domain: "Retail",
        description: "Интернет-магазин",
        startDate: new Date(Date.UTC(2020, 0, 1)),
        endDate: new Date(Date.UTC(2030, 0, 1)),
        skills: { create: [{ skillId: react.id }] },
      },
    });
    await prisma.cvProject.create({
      data: { cvId: annCv, projectId: project.id, startDate: new Date(Date.UTC(2021, 0, 1)) },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it("gives the owner a real PDF file with a name made from the CV name (AC-20, AC-22)", async () => {
    const { body } = await call(ann, annCv);

    expect(body.errors).toBeUndefined();
    const pdf = body.data?.["exportCvPdf"] as { fileName: string; base64: string };
    expect(pdf.fileName).toBe("разработчик-frontend.pdf");
    const bytes = Buffer.from(pdf.base64, "base64");
    expect(bytes.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(bytes.length).toBeGreaterThan(1000);
  });

  it("lets an admin export the CV of another user", async () => {
    const { body } = await call(admin, annCv);

    expect(body.errors).toBeUndefined();
    expect(body.data?.["exportCvPdf"]).toMatchObject({ fileName: "разработчик-frontend.pdf" });
  });

  it("exports a CV with no skills and no projects", async () => {
    const { body } = await call(ben, emptyCv);

    expect(body.errors).toBeUndefined();
    expect(body.data?.["exportCvPdf"]).toMatchObject({ fileName: "empty.pdf" });
  });

  it("answers NOT_FOUND for the CV of another user, like for a missing CV (AC-30, AC-31, AC-49)", async () => {
    const other = await call(ben, annCv);
    const missing = await call(ben, MISSING_ID);

    expect(other.body.errors?.[0]?.extensions.code).toBe("NOT_FOUND");
    expect(missing.body.errors?.[0]?.extensions.code).toBe("NOT_FOUND");
    expect(other.body.errors?.[0]?.message).toBe(missing.body.errors?.[0]?.message);
    expect(other.body.data).toBeNull();
  });

  it("answers BAD_USER_INPUT for an id that is not a UUID", async () => {
    const { body } = await call(ann, "not-a-uuid");

    expect(body.errors?.[0]?.extensions.code).toBe("BAD_USER_INPUT");
  });

  it("refuses a request without a session", async () => {
    const { body } = await call(null, annCv);

    expect(body.errors?.[0]?.extensions.code).toBe("UNAUTHENTICATED");
  });
});

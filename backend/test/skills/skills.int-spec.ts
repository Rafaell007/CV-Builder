import { INestApplication } from "@nestjs/common";
import { Role } from "../../src/generated/prisma/enums";
import { PrismaService } from "../../src/prisma/prisma.service";
import { createTestApp } from "../support/create-test-app";
import { createUser, TEST_PASSWORD } from "../support/create-user";
import { graphqlRequest, toCookiePair } from "../support/graphql-request";

const SIGN_IN = `mutation ($input: SignInInput!) { signIn(input: $input) { id } }`;
const SKILLS = `{ skills { id name } }`;

describe("skills", () => {
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
    await prisma.skill.createMany({
      data: [
        { name: "TypeScript", categoryId: category.id },
        { name: "React", categoryId: category.id },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it("lists the skills by name for an admin", async () => {
    const { body } = await graphqlRequest(app, SKILLS, { cookies: admin });

    expect(body.errors).toBeUndefined();
    expect((body.data as { skills: { name: string }[] }).skills.map((s) => s.name)).toEqual([
      "React",
      "TypeScript",
    ]);
  });

  it("refuses a user who is not an admin", async () => {
    const { body } = await graphqlRequest(app, SKILLS, { cookies: user });

    expect(body.errors?.[0]?.extensions.code).toBe("FORBIDDEN");
  });

  it("refuses a visitor who is not signed in", async () => {
    const { body } = await graphqlRequest(app, SKILLS);

    expect(body.errors?.[0]?.extensions.code).toBe("UNAUTHENTICATED");
  });
});

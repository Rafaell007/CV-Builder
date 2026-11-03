import type { NestExpressApplication } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configure-app";
import { MailService } from "../src/modules/mail";
import { PrismaService } from "../src/prisma/prisma.service";
import { createUser, TEST_PASSWORD } from "./support/create-user";
import { findSetCookie, graphqlRequest, toCookiePair } from "./support/graphql-request";

const SIGN_UP = `mutation ($input: SignUpInput!) {
  signUp(input: $input) { id email role isVerified firstName lastName }
}`;
const ME = "{ me { email isVerified } }";
const NEW_EMAIL = "new-user@example.com";

describe("sign up", () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  /** The codes the app tried to mail, newest last. The database holds only hashes. */
  let mailed: { to: string; code: string }[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue({
        sendVerificationCode: (to: string, code: string) => {
          mailed.push({ to, code });
          return Promise.resolve();
        },
      })
      .compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    mailed = [];
    await prisma.user.deleteMany({ where: { email: { in: [NEW_EMAIL, "taken@example.com"] } } });
  });

  function signUp(email = NEW_EMAIL, password = TEST_PASSWORD) {
    return graphqlRequest(app, SIGN_UP, { variables: { input: { email, password } } });
  }

  it("creates an unverified user with the default role", async () => {
    const { body } = await signUp();

    expect(body.errors).toBeUndefined();
    expect(body.data).toEqual({
      signUp: {
        id: expect.any(String),
        email: NEW_EMAIL,
        role: "USER",
        isVerified: false,
        firstName: null,
        lastName: null,
      },
    });
  });

  it("stores the email in lower case and the password only as an argon2 hash", async () => {
    await signUp("  New-User@Example.com ");

    const stored = await prisma.user.findUnique({ where: { email: NEW_EMAIL } });

    expect(stored?.passwordHash).toMatch(/^\$argon2id\$/);
    expect(stored?.passwordHash).not.toContain(TEST_PASSWORD);
  });

  it("signs the new user in with two httpOnly cookies", async () => {
    const { setCookies } = await signUp();

    for (const name of ["access_token", "refresh_token"]) {
      const cookie = findSetCookie(setCookies, name);
      expect(cookie).toContain("HttpOnly");
      expect(cookie).toContain("SameSite=Lax");
    }
    const accessCookie = toCookiePair(findSetCookie(setCookies, "access_token") ?? "");
    const { body } = await graphqlRequest(app, ME, { cookies: [accessCookie] });
    expect(body.data).toEqual({ me: { email: NEW_EMAIL, isVerified: false } });
  });

  it("mails one 6-digit code to the new address and stores only its hash", async () => {
    await signUp();

    expect(mailed).toHaveLength(1);
    expect(mailed[0]?.to).toBe(NEW_EMAIL);
    expect(mailed[0]?.code).toMatch(/^\d{6}$/);
    const user = await prisma.user.findUniqueOrThrow({ where: { email: NEW_EMAIL } });
    const codes = await prisma.verificationCode.findMany({ where: { userId: user.id } });
    expect(codes).toHaveLength(1);
    expect(codes[0]?.codeHash).not.toBe(mailed[0]?.code);
  });

  it("answers CONFLICT with the reason EMAIL_TAKEN when the email exists, in any letter case", async () => {
    await createUser(app, { email: "taken@example.com" });

    const { body, setCookies } = await signUp("Taken@Example.com");

    expect(body.data).toBeNull();
    expect(body.errors?.[0]?.message).toBe("An account with this email already exists");
    expect(body.errors?.[0]?.extensions).toMatchObject({
      code: "CONFLICT",
      reason: "EMAIL_TAKEN",
    });
    expect(setCookies).toEqual([]);
    expect(mailed).toEqual([]);
  });

  it("creates only one user when the same email is sent twice at once", async () => {
    const results = await Promise.all([signUp(), signUp()]);

    const failed = results.filter(({ body }) => body.errors !== undefined);
    expect(failed).toHaveLength(1);
    expect(failed[0]?.body.errors?.[0]?.extensions.code).toBe("CONFLICT");
    await expect(prisma.user.count({ where: { email: NEW_EMAIL } })).resolves.toBe(1);
  });

  it.each([
    ["an invalid email", "not-an-email", TEST_PASSWORD],
    ["a password shorter than 8 characters", NEW_EMAIL, "Pass123"],
    ["a password without a digit", NEW_EMAIL, "PasswordOnly"],
    ["a password without a letter", NEW_EMAIL, "12345678"],
    ["a password longer than 128 characters", NEW_EMAIL, "a".repeat(129)],
  ])("refuses %s with BAD_USER_INPUT and creates nothing", async (_name, email, password) => {
    const { body, setCookies } = await signUp(email, password);

    expect(body.errors?.[0]?.extensions.code).toBe("BAD_USER_INPUT");
    expect(setCookies).toEqual([]);
    expect(mailed).toEqual([]);
    await expect(prisma.user.count({ where: { email: NEW_EMAIL } })).resolves.toBe(0);
  });

  it("accepts a password of exactly 8 characters with a letter and a digit", async () => {
    const { body } = await signUp(NEW_EMAIL, "Passw0rd");

    expect(body.errors).toBeUndefined();
  });

  it("never returns the password or its hash", async () => {
    const { body } = await signUp();

    expect(JSON.stringify(body)).not.toMatch(/password|argon2/i);
  });
});

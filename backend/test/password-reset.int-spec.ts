import { Logger } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";
import { AppModule } from "../src/app.module";
import { Clock } from "../src/common/clock";
import { configureApp } from "../src/configure-app";
import { MailService } from "../src/modules/mail";
import { verifyPassword } from "../src/modules/auth/password";
import { PASSWORD_RESET_TOKEN_TTL_MS } from "../src/modules/auth/password-reset-token";
import { PrismaService } from "../src/prisma/prisma.service";
import { createUser, TEST_PASSWORD } from "./support/create-user";
import { findSetCookie, graphqlRequest, toCookiePair } from "./support/graphql-request";

const SIGN_IN = `mutation ($input: SignInInput!) { signIn(input: $input) { id } }`;
const FORGOT = `mutation ($input: ForgotPasswordInput!) { forgotPassword(input: $input) }`;
const RESET = `mutation ($input: ResetPasswordInput!) { resetPassword(input: $input) }`;
const REFRESH = "mutation { refresh }";
const START = new Date("2026-07-12T10:00:00.000Z");
const EMAIL = "forgetful@example.com";
const NEW_PASSWORD = "NewPassword456!";

describe("forgot and reset password", () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let now = START;
  /** The reset tokens the app tried to mail, newest last. The database holds only hashes. */
  let mailed: { to: string; token: string }[] = [];
  let userId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(Clock)
      .useValue({ now: () => now })
      .overrideProvider(MailService)
      .useValue({
        sendPasswordReset: (to: string, token: string) => {
          mailed.push({ to, token });
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
    now = START;
    mailed = [];
    await prisma.user.deleteMany({ where: { email: EMAIL } });
    userId = (await createUser(app, { email: EMAIL })).id;
  });

  function forgot(email: string) {
    return graphqlRequest(app, FORGOT, { variables: { input: { email } } });
  }

  function reset(token: string, newPassword = NEW_PASSWORD) {
    return graphqlRequest(app, RESET, { variables: { input: { token, newPassword } } });
  }

  function signIn(password: string, email = EMAIL) {
    return graphqlRequest(app, SIGN_IN, { variables: { input: { email, password } } });
  }

  /** The token of the last mail, as the user would follow it. */
  function lastToken(): string {
    return mailed[mailed.length - 1]?.token ?? "";
  }

  describe("forgotPassword", () => {
    it("mails a token to a registered email and stores only its hash (AC-9, AC-12)", async () => {
      const { body } = await forgot(EMAIL);

      expect(body).toEqual({ data: { forgotPassword: true } });
      expect(mailed).toHaveLength(1);
      expect(mailed[0]?.to).toBe(EMAIL);
      expect(lastToken()).toMatch(/^[A-Za-z0-9_-]{43}$/);
      const rows = await prisma.passwordResetToken.findMany({ where: { userId } });
      expect(rows).toHaveLength(1);
      expect(rows[0]?.tokenHash).not.toContain(lastToken());
      expect(rows[0]?.usedAt).toBeNull();
    });

    it("gives an expiry time of 1 hour (AC-10)", async () => {
      await forgot(EMAIL);

      const row = await prisma.passwordResetToken.findFirstOrThrow({ where: { userId } });
      expect(row.expiresAt).toEqual(new Date(START.getTime() + PASSWORD_RESET_TOKEN_TTL_MS));
    });

    it("answers the same for an unknown email and sends no mail (AC-15, AC-16)", async () => {
      const known = await forgot(EMAIL);
      const unknown = await forgot("nobody@example.com");

      expect(unknown.body).toEqual(known.body);
      expect(mailed).toHaveLength(1);
      expect(await prisma.passwordResetToken.count()).toBe(1);
    });

    it("finds the user whatever the case or the spaces of the email", async () => {
      await forgot("  Forgetful@Example.COM ");

      expect(mailed).toHaveLength(1);
    });

    it("answers the same when the mail cannot be sent (AC-15)", async () => {
      const mail = app.get(MailService);
      const send = jest.spyOn(mail, "sendPasswordReset").mockRejectedValue(new Error("SMTP down"));
      const logged = jest.spyOn(Logger.prototype, "error").mockImplementation();

      const { body } = await forgot(EMAIL);

      expect(body).toEqual({ data: { forgotPassword: true } });
      send.mockRestore();
      logged.mockRestore();
    });

    it("makes the earlier token stop working", async () => {
      await forgot(EMAIL);
      const oldToken = lastToken();
      await forgot(EMAIL);

      const withOld = await reset(oldToken);

      expect(withOld.body.errors?.[0]?.extensions).toMatchObject({ reason: "RESET_TOKEN_INVALID" });
      expect(await prisma.passwordResetToken.count({ where: { userId } })).toBe(1);
    });

    it("rejects an email that is not valid (AC-8)", async () => {
      const { body } = await forgot("not-an-email");

      expect(body.errors?.[0]?.extensions.code).toBe("BAD_USER_INPUT");
      expect(mailed).toHaveLength(0);
    });

    it("needs no session (AC-1)", async () => {
      const { body } = await forgot(EMAIL);

      expect(body.errors).toBeUndefined();
    });
  });

  describe("resetPassword", () => {
    beforeEach(async () => {
      await forgot(EMAIL);
    });

    it("sets the new password and stops the old one (AC-16, AC-19)", async () => {
      const { body } = await reset(lastToken());

      expect(body).toEqual({ data: { resetPassword: true } });
      expect((await signIn(NEW_PASSWORD)).body.data).toEqual({ signIn: { id: userId } });
      expect((await signIn(TEST_PASSWORD)).body.errors?.[0]?.extensions.code).toBe(
        "UNAUTHENTICATED",
      );
    });

    it("stores a hash and never the password (AC-17)", async () => {
      await reset(lastToken());

      const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
      expect(user.passwordHash).not.toContain(NEW_PASSWORD);
      expect(await verifyPassword(user.passwordHash, NEW_PASSWORD)).toBe(true);
    });

    it("does not sign the user in", async () => {
      const { setCookies } = await reset(lastToken());

      expect(findSetCookie(setCookies, "access_token")).toBeUndefined();
      expect(findSetCookie(setCookies, "refresh_token")).toBeUndefined();
    });

    it("rejects a second use of the same token (AC-15, AC-18)", async () => {
      const token = lastToken();
      await reset(token);

      const again = await reset(token, "AnotherPassword789!");

      expect(again.body.errors?.[0]?.extensions).toMatchObject({
        code: "BAD_USER_INPUT",
        reason: "RESET_TOKEN_USED",
      });
      expect((await signIn(NEW_PASSWORD)).body.errors).toBeUndefined();
    });

    it("rejects a token that was never issued (AC-13)", async () => {
      const { body } = await reset("a".repeat(43));

      expect(body.errors?.[0]?.extensions).toMatchObject({ reason: "RESET_TOKEN_INVALID" });
      expect((await signIn(TEST_PASSWORD)).body.errors).toBeUndefined();
    });

    it("rejects an empty token before it reaches the service (AC-12)", async () => {
      const { body } = await reset("");

      expect(body.errors?.[0]?.extensions.code).toBe("BAD_USER_INPUT");
    });

    it("accepts the token 1 ms before it expires and rejects it at the expiry time (AC-14)", async () => {
      now = new Date(START.getTime() + PASSWORD_RESET_TOKEN_TTL_MS);
      const expired = await reset(lastToken());

      expect(expired.body.errors?.[0]?.extensions).toMatchObject({ reason: "RESET_TOKEN_EXPIRED" });
      expect((await signIn(TEST_PASSWORD)).body.errors).toBeUndefined();

      now = new Date(START.getTime() + PASSWORD_RESET_TOKEN_TTL_MS - 1);
      const inTime = await reset(lastToken());

      expect(inTime.body).toEqual({ data: { resetPassword: true } });
    });

    it.each([
      ["7 characters", "Abcde12"],
      ["no digit", "Abcdefghij"],
      ["no letter", "1234567890"],
      ["129 characters", `a1${"b".repeat(127)}`],
    ])("keeps the old password when the new one has %s (AC-5, D32)", async (_name, weak) => {
      const { body } = await reset(lastToken(), weak);

      expect(body.errors?.[0]?.extensions.code).toBe("BAD_USER_INPUT");
      expect((await signIn(TEST_PASSWORD)).body.errors).toBeUndefined();
      // The token was not used up, so the user can try again.
      expect((await reset(lastToken())).body).toEqual({ data: { resetPassword: true } });
    });

    it("accepts a password of exactly 8 characters with a letter and a digit (D32)", async () => {
      const { body } = await reset(lastToken(), "Abcdef12");

      expect(body).toEqual({ data: { resetPassword: true } });
    });

    it("ends every session of the user (D22)", async () => {
      const first = await signIn(TEST_PASSWORD);
      const second = await signIn(TEST_PASSWORD);
      const refreshCookies = [first, second].map(({ setCookies }) =>
        toCookiePair(findSetCookie(setCookies, "refresh_token") ?? ""),
      );
      expect(await prisma.refreshToken.count({ where: { userId } })).toBe(2);

      await reset(lastToken());

      expect(await prisma.refreshToken.count({ where: { userId } })).toBe(0);
      for (const cookie of refreshCookies) {
        const { body } = await graphqlRequest(app, REFRESH, { cookies: [cookie] });
        expect(body.errors?.[0]?.extensions.code).toBe("UNAUTHENTICATED");
      }
    });

    it("leaves the sessions of other users alone", async () => {
      const other = await createUser(app, { email: "other-forgetful@example.com" });
      await signIn(TEST_PASSWORD, "other-forgetful@example.com");

      await reset(lastToken());

      expect(await prisma.refreshToken.count({ where: { userId: other.id } })).toBe(1);
      await prisma.user.delete({ where: { id: other.id } });
    });

    it("lets only one of two parallel requests use the token", async () => {
      const token = lastToken();

      const results = await Promise.all([reset(token), reset(token, "AnotherPassword789!")]);

      const succeeded = results.filter(({ body }) => body.errors === undefined);
      expect(succeeded).toHaveLength(1);
      const failed = results.find(({ body }) => body.errors !== undefined);
      expect(failed?.body.errors?.[0]?.extensions).toMatchObject({ reason: "RESET_TOKEN_USED" });
    });
  });
});

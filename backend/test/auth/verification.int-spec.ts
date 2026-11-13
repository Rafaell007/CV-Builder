import type { NestExpressApplication } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";
import { AppModule } from "../../src/app.module";
import { Clock } from "../../src/common/clock";
import { configureApp } from "../../src/configure-app";
import { MailService } from "../../src/modules/mail";
import {
  VERIFICATION_CODE_TTL_MS,
  VERIFICATION_MAX_ATTEMPTS,
  VERIFICATION_RESEND_COOLDOWN_MS,
} from "../../src/modules/auth/verification/verification-code";
import { PrismaService } from "../../src/prisma/prisma.service";
import { createUser, TEST_PASSWORD } from "../support/create-user";
import { findSetCookie, graphqlRequest, toCookiePair } from "../support/graphql-request";

const SIGN_IN = `mutation ($input: SignInInput!) { signIn(input: $input) { id } }`;
const VERIFY = `mutation ($input: VerifyEmailInput!) { verifyEmail(input: $input) { id isVerified } }`;
const RESEND = "mutation { resendVerificationCode }";
const ME = "{ me { isVerified } }";
const START = new Date("2026-07-12T10:00:00.000Z");

describe("email verification", () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let now = START;
  /** The codes the app tried to mail, newest last. The database holds only hashes. */
  let mailed: { to: string; code: string }[] = [];
  let userId: string;
  let cookie: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(Clock)
      .useValue({ now: () => now })
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
    now = START;
    mailed = [];
    await prisma.verificationCode.deleteMany();
    await prisma.user.deleteMany({ where: { email: "unverified@example.com" } });
    userId = (await createUser(app, { email: "unverified@example.com", isVerified: false })).id;
    cookie = await signIn("unverified@example.com");
  });

  async function signIn(email: string): Promise<string> {
    const { setCookies } = await graphqlRequest(app, SIGN_IN, {
      variables: { input: { email, password: TEST_PASSWORD } },
    });
    return toCookiePair(findSetCookie(setCookies, "access_token") ?? "");
  }

  function verify(code: string, sessionCookie = cookie) {
    return graphqlRequest(app, VERIFY, {
      cookies: [sessionCookie],
      variables: { input: { code } },
    });
  }

  function resend(sessionCookie = cookie) {
    return graphqlRequest(app, RESEND, { cookies: [sessionCookie] });
  }

  async function isVerified(): Promise<boolean> {
    const { body } = await graphqlRequest(app, ME, { cookies: [cookie] });
    return (body.data as { me: { isVerified: boolean } }).me.isVerified;
  }

  /** The code of the last mail, as the user would read it. */
  function lastCode(): string {
    return mailed[mailed.length - 1]?.code ?? "";
  }

  function wrongCode(): string {
    return lastCode() === "000000" ? "000001" : "000000";
  }

  describe("resendVerificationCode", () => {
    it("mails a 6-digit code and stores only its hash", async () => {
      const { body } = await resend();

      expect(body).toEqual({ data: { resendVerificationCode: true } });
      expect(mailed).toHaveLength(1);
      expect(mailed[0]?.to).toBe("unverified@example.com");
      expect(lastCode()).toMatch(/^\d{6}$/);
      const rows = await prisma.verificationCode.findMany({ where: { userId } });
      expect(rows).toHaveLength(1);
      expect(rows[0]?.codeHash).not.toContain(lastCode());
      expect(rows[0]?.expiresAt).toEqual(new Date(START.getTime() + VERIFICATION_CODE_TTL_MS));
    });

    it("refuses a second request inside 60 seconds and accepts one after", async () => {
      await resend();

      const early = await resend();
      expect(early.body.errors?.[0]?.extensions).toMatchObject({
        code: "TOO_MANY_REQUESTS",
        reason: "RESEND_COOLDOWN",
      });
      expect(mailed).toHaveLength(1);

      now = new Date(START.getTime() + VERIFICATION_RESEND_COOLDOWN_MS);
      const later = await resend();
      expect(later.body).toEqual({ data: { resendVerificationCode: true } });
      expect(mailed).toHaveLength(2);
    });

    it("makes the earlier code stop working (AC-19)", async () => {
      await resend();
      const oldCode = lastCode();
      now = new Date(START.getTime() + VERIFICATION_RESEND_COOLDOWN_MS);
      await resend();
      // 1 in a million that both codes are equal; the next line would then be a false alarm
      if (lastCode() === oldCode) return;

      const withOld = await verify(oldCode);

      expect(withOld.body.errors?.[0]?.extensions).toMatchObject({ reason: "CODE_INVALID" });
      expect(await prisma.verificationCode.count({ where: { userId } })).toBe(1);
    });

    it("refuses a user who is already verified", async () => {
      await prisma.user.update({ where: { id: userId }, data: { isVerified: true } });

      const { body } = await resend();

      expect(body.errors?.[0]?.extensions).toMatchObject({
        code: "CONFLICT",
        reason: "ALREADY_VERIFIED",
      });
      expect(mailed).toHaveLength(0);
    });

    it("needs a session", async () => {
      const { body } = await graphqlRequest(app, RESEND);

      expect(body.errors?.[0]?.extensions.code).toBe("UNAUTHENTICATED");
    });
  });

  describe("verifyEmail", () => {
    beforeEach(async () => {
      await resend();
    });

    it("verifies the user and uses up the code (AC-12, AC-13)", async () => {
      const { body } = await verify(lastCode());

      expect(body).toEqual({ data: { verifyEmail: { id: userId, isVerified: true } } });
      expect(await isVerified()).toBe(true);
      const row = await prisma.verificationCode.findFirstOrThrow({ where: { userId } });
      expect(row.usedAt).toEqual(START);
    });

    it("rejects a second use of the same code", async () => {
      const code = lastCode();
      await verify(code);

      const again = await verify(code);

      // The user is verified now, so the flow itself is closed (the page's Scope section).
      expect(again.body.errors?.[0]?.extensions).toMatchObject({ reason: "ALREADY_VERIFIED" });
    });

    it("rejects a used code that is still the newest one (AC-8)", async () => {
      const code = lastCode();
      await verify(code);
      await prisma.user.update({ where: { id: userId }, data: { isVerified: false } });

      const again = await verify(code);

      expect(again.body.errors?.[0]?.extensions).toMatchObject({ reason: "CODE_USED" });
      expect(await isVerified()).toBe(false);
    });

    it("accepts the code 1 ms before it expires and rejects it at the expiry time (AC-4, AC-7)", async () => {
      now = new Date(START.getTime() + VERIFICATION_CODE_TTL_MS);
      const expired = await verify(lastCode());

      expect(expired.body.errors?.[0]?.extensions).toMatchObject({ reason: "CODE_EXPIRED" });
      expect(await isVerified()).toBe(false);

      now = new Date(START.getTime() + VERIFICATION_CODE_TTL_MS - 1);
      const inTime = await verify(lastCode());

      expect(inTime.body.errors).toBeUndefined();
      expect(await isVerified()).toBe(true);
    });

    it("rejects a wrong code and keeps the user unverified (AC-6)", async () => {
      const { body } = await verify(wrongCode());

      expect(body.errors?.[0]?.extensions).toMatchObject({
        code: "BAD_USER_INPUT",
        reason: "CODE_INVALID",
      });
      expect(await isVerified()).toBe(false);
    });

    it("blocks the correct code after 5 wrong tries", async () => {
      const code = lastCode();
      for (let attempt = 0; attempt < VERIFICATION_MAX_ATTEMPTS; attempt++) {
        const { body } = await verify(wrongCode());
        expect(body.errors?.[0]?.extensions).toMatchObject({ reason: "CODE_INVALID" });
      }

      const blocked = await verify(code);

      expect(blocked.body.errors?.[0]?.extensions).toMatchObject({
        code: "TOO_MANY_REQUESTS",
        reason: "TOO_MANY_ATTEMPTS",
      });
      expect(await isVerified()).toBe(false);

      // A new code starts again with a fresh count.
      now = new Date(START.getTime() + VERIFICATION_RESEND_COOLDOWN_MS);
      await resend();
      expect((await verify(lastCode())).body.errors).toBeUndefined();
    });

    it("accepts the correct code on the fifth try", async () => {
      const code = lastCode();
      for (let attempt = 0; attempt < VERIFICATION_MAX_ATTEMPTS - 1; attempt++) {
        await verify(wrongCode());
      }

      const { body } = await verify(code);

      expect(body.errors).toBeUndefined();
      expect(await isVerified()).toBe(true);
    });

    it.each(["", "12345", "1234567", "12345a"])(
      "rejects the format %j before it looks up anything",
      async (code) => {
        const { body } = await verify(code);

        expect(body.errors?.[0]?.extensions.code).toBe("BAD_USER_INPUT");
        expect(
          (await prisma.verificationCode.findFirstOrThrow({ where: { userId } })).attempts,
        ).toBe(0);
      },
    );

    it("cannot verify the user with the code of another user", async () => {
      const other = await createUser(app, {
        email: "other-unverified@example.com",
        isVerified: false,
      });
      const otherCookie = await signIn("other-unverified@example.com");

      const { body } = await verify(lastCode(), otherCookie);

      expect(body.errors?.[0]?.extensions).toMatchObject({ reason: "CODE_INVALID" });
      expect(await isVerified()).toBe(false);
      await prisma.user.delete({ where: { id: other.id } });
    });

    it("needs a session", async () => {
      const { body } = await graphqlRequest(app, VERIFY, {
        variables: { input: { code: lastCode() } },
      });

      expect(body.errors?.[0]?.extensions.code).toBe("UNAUTHENTICATED");
    });
  });
});

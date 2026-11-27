import { INestApplication } from "@nestjs/common";
import { PrismaService } from "../../src/prisma/prisma.service";
import { createUser, TEST_PASSWORD } from "../support/create-user";
import { createTestApp } from "../support/create-test-app";
import { findSetCookie, graphqlRequest, toCookiePair } from "../support/graphql-request";

const SIGN_IN = `mutation ($input: SignInInput!) {
  signIn(input: $input) { id email role isVerified firstName lastName }
}`;
const ME = "{ me { id email role } }";
const SIGN_OUT = "mutation { signOut }";

describe("authentication", () => {
  let app: INestApplication;
  let userId: string;

  beforeAll(async () => {
    app = await createTestApp();
    userId = (await createUser(app, { email: "user1@example.com" })).id;
  });

  afterAll(async () => {
    await app.close();
  });

  async function signIn(email = "user1@example.com", password = TEST_PASSWORD) {
    return graphqlRequest(app, SIGN_IN, { variables: { input: { email, password } } });
  }

  describe("signIn", () => {
    it("returns the user and sets two httpOnly cookies", async () => {
      const { body, setCookies } = await signIn();

      expect(body.errors).toBeUndefined();
      expect(body.data).toEqual({
        signIn: {
          id: userId,
          email: "user1@example.com",
          role: "USER",
          isVerified: true,
          firstName: null,
          lastName: null,
        },
      });
      for (const name of ["access_token", "refresh_token"]) {
        const cookie = findSetCookie(setCookies, name);
        expect(cookie).toContain("HttpOnly");
        expect(cookie).toContain("SameSite=Lax");
        expect(cookie).toContain("Path=/");
        expect(cookie).not.toContain("Secure"); // only in production
      }
    });

    it("gives the cookies their lifetimes: 15 minutes and 7 days", async () => {
      const { setCookies } = await signIn();

      expect(findSetCookie(setCookies, "access_token")).toContain("Max-Age=900");
      expect(findSetCookie(setCookies, "refresh_token")).toContain("Max-Age=604800");
    });

    it("stores the refresh token only as a hash", async () => {
      const { setCookies } = await signIn();
      const refreshToken = toCookiePair(findSetCookie(setCookies, "refresh_token") ?? "").split(
        "=",
      )[1];

      const stored = await app.get(PrismaService).refreshToken.findMany({ where: { userId } });

      expect(stored.length).toBeGreaterThan(0);
      expect(stored.some(({ tokenHash }) => tokenHash === refreshToken)).toBe(false);
      const latest = stored.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
      expect(latest?.expiresAt.getTime()).toBeGreaterThan(Date.now() + 6 * 24 * 60 * 60 * 1000);
    });

    it("accepts the email in another case and with spaces", async () => {
      const { body } = await signIn("  USER1@Example.com ");

      expect(body.errors).toBeUndefined();
    });

    it("gives the same error for a wrong password and an unknown email, and sets no cookie", async () => {
      const wrongPassword = await signIn("user1@example.com", "Wrong-password1");
      const unknownEmail = await signIn("nobody@example.com", TEST_PASSWORD);

      for (const result of [wrongPassword, unknownEmail]) {
        expect(result.body.data).toBeNull();
        expect(result.body.errors?.[0]?.message).toBe("Invalid email or password");
        expect(result.body.errors?.[0]?.extensions.code).toBe("UNAUTHENTICATED");
        expect(result.setCookies).toEqual([]);
      }
    });

    it("rejects invalid input with field errors, before looking at the database", async () => {
      const { body } = await signIn("not-an-email", "123");

      expect(body.errors?.[0]?.extensions.code).toBe("BAD_USER_INPUT");
      expect(JSON.stringify(body.errors?.[0]?.extensions.fieldErrors)).toContain("email");
      expect(JSON.stringify(body.errors?.[0]?.extensions.fieldErrors)).toContain("password");
    });

    it("does not put the password in the error", async () => {
      const { body } = await signIn("user1@example.com", "Secret-that-is-wrong-1");

      expect(JSON.stringify(body)).not.toContain("Secret-that-is-wrong-1");
    });
  });

  describe("me", () => {
    it("returns the signed-in user", async () => {
      const { setCookies } = await signIn();

      const { body } = await graphqlRequest(app, ME, { cookies: setCookies.map(toCookiePair) });

      expect(body.data).toEqual({ me: { id: userId, email: "user1@example.com", role: "USER" } });
    });

    it("returns null, not an error, when nobody is signed in", async () => {
      const { body } = await graphqlRequest(app, ME);

      expect(body).toEqual({ data: { me: null } });
    });

    it("returns null for a token that is not valid", async () => {
      const { body } = await graphqlRequest(app, ME, { cookies: ["access_token=garbage"] });

      expect(body).toEqual({ data: { me: null } });
    });

    it("returns null once the user was deleted", async () => {
      const doomed = await createUser(app, { email: "doomed@example.com" });
      const { setCookies } = await signIn("doomed@example.com");
      await app.get(PrismaService).user.delete({ where: { id: doomed.id } });

      const { body } = await graphqlRequest(app, ME, { cookies: setCookies.map(toCookiePair) });

      expect(body).toEqual({ data: { me: null } });
    });
  });

  describe("signOut", () => {
    it("clears both cookies and removes the session from the database", async () => {
      const { setCookies } = await signIn();
      const cookies = setCookies.map(toCookiePair);
      const prisma = app.get(PrismaService);
      const before = await prisma.refreshToken.count({ where: { userId } });

      const result = await graphqlRequest(app, SIGN_OUT, { cookies });

      expect(result.body).toEqual({ data: { signOut: true } });
      for (const name of ["access_token", "refresh_token"]) {
        expect(findSetCookie(result.setCookies, name)).toMatch(
          /^[a-z_]+=;.*Expires=Thu, 01 Jan 1970/,
        );
      }
      expect(await prisma.refreshToken.count({ where: { userId } })).toBe(before - 1);
    });

    it("works without a session and does not fail", async () => {
      const { body } = await graphqlRequest(app, SIGN_OUT);

      expect(body).toEqual({ data: { signOut: true } });
    });

    it("works with an expired access token, as long as the refresh cookie is there", async () => {
      const { setCookies } = await signIn();
      const refresh = toCookiePair(findSetCookie(setCookies, "refresh_token") ?? "");

      const { body } = await graphqlRequest(app, SIGN_OUT, { cookies: [refresh] });

      expect(body).toEqual({ data: { signOut: true } });
    });
  });

  it("keeps the health query public", async () => {
    const { body } = await graphqlRequest(app, "{ health { status } }");

    expect(body).toEqual({ data: { health: { status: "ok" } } });
  });
});

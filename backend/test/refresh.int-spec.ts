import { INestApplication } from "@nestjs/common";
import { PrismaService } from "../src/prisma/prisma.service";
import { createUser, TEST_PASSWORD } from "./support/create-user";
import { createTestApp } from "./support/create-test-app";
import { findSetCookie, graphqlRequest, toCookiePair } from "./support/graphql-request";

const SIGN_IN = `mutation ($input: SignInInput!) { signIn(input: $input) { id } }`;
const REFRESH = "mutation { refresh }";
const ME = "{ me { id } }";

describe("refresh", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userId: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    userId = (await createUser(app, { email: "user1@example.com" })).id;
  });

  afterAll(async () => {
    await app.close();
  });

  /** Signs in and returns the cookies, as `name=value` pairs. */
  async function signIn(): Promise<{ access: string; refresh: string }> {
    const { setCookies } = await graphqlRequest(app, SIGN_IN, {
      variables: { input: { email: "user1@example.com", password: TEST_PASSWORD } },
    });
    return {
      access: toCookiePair(findSetCookie(setCookies, "access_token") ?? ""),
      refresh: toCookiePair(findSetCookie(setCookies, "refresh_token") ?? ""),
    };
  }

  describe("rotation", () => {
    it("sets new cookies and the new access token works", async () => {
      const first = await signIn();

      const result = await graphqlRequest(app, REFRESH, { cookies: [first.refresh] });

      expect(result.body).toEqual({ data: { refresh: true } });
      const access = toCookiePair(findSetCookie(result.setCookies, "access_token") ?? "");
      const refresh = toCookiePair(findSetCookie(result.setCookies, "refresh_token") ?? "");
      expect(findSetCookie(result.setCookies, "refresh_token")).toContain("HttpOnly");
      expect(refresh).not.toBe(first.refresh);
      const me = await graphqlRequest(app, ME, { cookies: [access] });
      expect(me.body).toEqual({ data: { me: { id: userId } } });
    });

    it("marks the old token as replaced and puts the new one in the same family", async () => {
      await prisma.refreshToken.deleteMany({ where: { userId } });
      const first = await signIn();

      await graphqlRequest(app, REFRESH, { cookies: [first.refresh] });

      const rows = await prisma.refreshToken.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
      });
      expect(rows).toHaveLength(2);
      expect(rows[0]?.replacedAt).not.toBeNull();
      expect(rows[1]?.replacedAt).toBeNull();
      expect(rows[1]?.familyId).toBe(rows[0]?.familyId);
    });

    it("keeps working in a chain: each new token can be refreshed again", async () => {
      const first = await signIn();
      const second = await graphqlRequest(app, REFRESH, { cookies: [first.refresh] });
      const secondRefresh = toCookiePair(findSetCookie(second.setCookies, "refresh_token") ?? "");

      const third = await graphqlRequest(app, REFRESH, { cookies: [secondRefresh] });

      expect(third.body).toEqual({ data: { refresh: true } });
    });

    it.each([
      ["no cookie", []],
      ["an unknown token", ["refresh_token=not-a-real-token"]],
    ])("answers UNAUTHENTICATED and clears the cookies for %s", async (_name, cookies) => {
      const { body, setCookies } = await graphqlRequest(app, REFRESH, { cookies });

      expect(body.data).toBeNull();
      expect(body.errors?.[0]?.extensions.code).toBe("UNAUTHENTICATED");
      expect(findSetCookie(setCookies, "refresh_token")).toMatch(/Expires=Thu, 01 Jan 1970/);
    });

    it("rejects an expired token", async () => {
      await prisma.refreshToken.deleteMany({ where: { userId } });
      const first = await signIn();
      await prisma.refreshToken.updateMany({
        where: { userId },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      const { body } = await graphqlRequest(app, REFRESH, { cookies: [first.refresh] });

      expect(body.errors?.[0]?.extensions.code).toBe("UNAUTHENTICATED");
    });
  });

  describe("grace window", () => {
    it("accepts the old token again right after rotation, for parallel requests", async () => {
      await prisma.refreshToken.deleteMany({ where: { userId } });
      const first = await signIn();

      const [one, two] = await Promise.all([
        graphqlRequest(app, REFRESH, { cookies: [first.refresh] }),
        graphqlRequest(app, REFRESH, { cookies: [first.refresh] }),
      ]);

      expect(one.body).toEqual({ data: { refresh: true } });
      expect(two.body).toEqual({ data: { refresh: true } });
      const rows = await prisma.refreshToken.findMany({ where: { userId } });
      const families = new Set(rows.map((row) => row.familyId));
      expect(families.size).toBe(1);
    });

    it("accepts the old token only once more: the second grace use revokes the family", async () => {
      await prisma.refreshToken.deleteMany({ where: { userId } });
      const first = await signIn();
      await graphqlRequest(app, REFRESH, { cookies: [first.refresh] }); // rotation
      const grace = await graphqlRequest(app, REFRESH, { cookies: [first.refresh] });
      expect(grace.body).toEqual({ data: { refresh: true } });

      const third = await graphqlRequest(app, REFRESH, { cookies: [first.refresh] });

      expect(third.body.errors?.[0]?.extensions.code).toBe("UNAUTHENTICATED");
      expect(await prisma.refreshToken.count({ where: { userId } })).toBe(0);
    });

    it("still accepts the old token 29 seconds after rotation", async () => {
      await prisma.refreshToken.deleteMany({ where: { userId } });
      const first = await signIn();
      await graphqlRequest(app, REFRESH, { cookies: [first.refresh] });
      await prisma.refreshToken.updateMany({
        where: { userId, replacedAt: { not: null } },
        data: { replacedAt: new Date(Date.now() - 29 * 1000) },
      });

      const { body } = await graphqlRequest(app, REFRESH, { cookies: [first.refresh] });

      expect(body).toEqual({ data: { refresh: true } });
    });
  });

  describe("family revoke", () => {
    it("deletes the whole family when a replaced token is used after the window", async () => {
      await prisma.refreshToken.deleteMany({ where: { userId } });
      const first = await signIn();
      const second = await graphqlRequest(app, REFRESH, { cookies: [first.refresh] });
      const secondRefresh = toCookiePair(findSetCookie(second.setCookies, "refresh_token") ?? "");
      await prisma.refreshToken.updateMany({
        where: { userId, replacedAt: { not: null } },
        data: { replacedAt: new Date(Date.now() - 31 * 1000) },
      });

      const reuse = await graphqlRequest(app, REFRESH, { cookies: [first.refresh] });

      expect(reuse.body.errors?.[0]?.extensions.code).toBe("UNAUTHENTICATED");
      expect(findSetCookie(reuse.setCookies, "refresh_token")).toMatch(/Expires=Thu, 01 Jan 1970/);
      expect(await prisma.refreshToken.count({ where: { userId } })).toBe(0);
      // The newest token of the family is dead too, so a thief who holds it is locked out.
      const afterwards = await graphqlRequest(app, REFRESH, { cookies: [secondRefresh] });
      expect(afterwards.body.errors?.[0]?.extensions.code).toBe("UNAUTHENTICATED");
    });

    it("does not touch the other sessions of the same user", async () => {
      await prisma.refreshToken.deleteMany({ where: { userId } });
      const phone = await signIn();
      const laptop = await signIn();
      await graphqlRequest(app, REFRESH, { cookies: [phone.refresh] });
      await prisma.refreshToken.updateMany({
        where: { userId, replacedAt: { not: null } },
        data: { replacedAt: new Date(Date.now() - 31 * 1000) },
      });

      await graphqlRequest(app, REFRESH, { cookies: [phone.refresh] });

      const { body } = await graphqlRequest(app, REFRESH, { cookies: [laptop.refresh] });
      expect(body).toEqual({ data: { refresh: true } });
    });
  });
});

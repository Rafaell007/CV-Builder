import type { NestExpressApplication } from "@nestjs/platform-express";
import { verifyPassword } from "../../src/modules/auth/password";
import { PrismaService } from "../../src/prisma/prisma.service";
import { createTestApp } from "../support/create-test-app";
import { createUser, TEST_PASSWORD } from "../support/create-user";
import { findSetCookie, graphqlRequest, toCookiePair } from "../support/graphql-request";

const SIGN_IN = `mutation ($input: SignInInput!) { signIn(input: $input) { id } }`;
const CHANGE = `mutation ($input: ChangePasswordInput!) { changePassword(input: $input) }`;
const REFRESH = "mutation { refresh }";
const ME = "{ me { id } }";
const EMAIL = "changer@example.com";
const NEW_PASSWORD = "NewPassword456!";

/** The `name=value` pairs of both session cookies, as the browser would send them back. */
interface Session {
  access: string;
  refresh: string;
}

describe("changePassword", () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let userId: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany({ where: { email: EMAIL } });
    userId = (await createUser(app, { email: EMAIL })).id;
  });

  function signIn(password: string) {
    return graphqlRequest(app, SIGN_IN, { variables: { input: { email: EMAIL, password } } });
  }

  function toSession(setCookies: string[]): Session {
    return {
      access: toCookiePair(findSetCookie(setCookies, "access_token") ?? ""),
      refresh: toCookiePair(findSetCookie(setCookies, "refresh_token") ?? ""),
    };
  }

  async function openSession(): Promise<Session> {
    return toSession((await signIn(TEST_PASSWORD)).setCookies);
  }

  function change(
    session: Session | undefined,
    input: Record<string, unknown> = { currentPassword: TEST_PASSWORD, newPassword: NEW_PASSWORD },
  ) {
    return graphqlRequest(app, CHANGE, {
      cookies: session === undefined ? [] : [session.access, session.refresh],
      variables: { input },
    });
  }

  function me(session: Session) {
    return graphqlRequest(app, ME, { cookies: [session.access] });
  }

  function refresh(session: Session) {
    return graphqlRequest(app, REFRESH, { cookies: [session.refresh] });
  }

  it("sets the new password and stops the old one", async () => {
    const { body } = await change(await openSession());

    // Only `true` comes back: never the password or its hash.
    expect(body).toEqual({ data: { changePassword: true } });
    expect((await signIn(NEW_PASSWORD)).body.data).toEqual({ signIn: { id: userId } });
    expect((await signIn(TEST_PASSWORD)).body.errors?.[0]?.extensions.code).toBe("UNAUTHENTICATED");
  });

  it("stores a hash and never the password", async () => {
    await change(await openSession());

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(user.passwordHash).not.toContain(NEW_PASSWORD);
    expect(await verifyPassword(user.passwordHash, NEW_PASSWORD)).toBe(true);
  });

  it("keeps the current session working with new cookies", async () => {
    const before = await openSession();

    const { setCookies } = await change(before);
    const after = toSession(setCookies);

    expect(after.access).not.toBe(before.access);
    expect(after.refresh).not.toBe(before.refresh);
    expect((await me(after)).body.data).toEqual({ me: { id: userId } });
    expect((await refresh(after)).body).toEqual({ data: { refresh: true } });
  });

  it("ends every other session at once (D22)", async () => {
    const other = await openSession();
    const current = await openSession();
    expect((await me(other)).body.data).toEqual({ me: { id: userId } });

    await change(current);

    // `me` is public: an ended session reads as "nobody is signed in".
    expect((await me(other)).body).toEqual({ data: { me: null } });
    expect((await refresh(other)).body.errors?.[0]?.extensions.code).toBe("UNAUTHENTICATED");
    expect(await prisma.refreshToken.count({ where: { userId } })).toBe(1);
  });

  it("rejects a wrong current password and changes nothing", async () => {
    const session = await openSession();

    const { body, setCookies } = await change(session, {
      currentPassword: "Wrong-password1",
      newPassword: NEW_PASSWORD,
    });

    expect(body.errors?.[0]?.extensions).toMatchObject({
      code: "BAD_USER_INPUT",
      reason: "CURRENT_PASSWORD_INCORRECT",
    });
    expect(setCookies).toEqual([]);
    expect((await me(session)).body.data).toEqual({ me: { id: userId } });
    expect((await signIn(TEST_PASSWORD)).body.errors).toBeUndefined();
  });

  it("needs a signed-in user", async () => {
    const { body } = await change(undefined);

    expect(body.errors?.[0]?.extensions.code).toBe("UNAUTHENTICATED");
    expect((await signIn(TEST_PASSWORD)).body.errors).toBeUndefined();
  });

  it("works for a user who has not verified the email yet (decision C)", async () => {
    await prisma.user.update({ where: { id: userId }, data: { isVerified: false } });

    const { body } = await change(await openSession());

    expect(body).toEqual({ data: { changePassword: true } });
  });

  it.each([
    ["7 characters", "Abcde12"],
    ["no digit", "Abcdefghij"],
    ["no letter", "1234567890"],
    ["129 characters", `a1${"b".repeat(127)}`],
  ])("keeps the old password when the new one has %s (D33)", async (_name, weak) => {
    const { body } = await change(await openSession(), {
      currentPassword: TEST_PASSWORD,
      newPassword: weak,
    });

    expect(body.errors?.[0]?.extensions.code).toBe("BAD_USER_INPUT");
    expect((await signIn(TEST_PASSWORD)).body.errors).toBeUndefined();
  });

  it("rejects an empty current password before it reaches the service", async () => {
    const { body } = await change(await openSession(), {
      currentPassword: "",
      newPassword: NEW_PASSWORD,
    });

    expect(body.errors?.[0]?.extensions.code).toBe("BAD_USER_INPUT");
    expect(body.errors?.[0]?.extensions.reason).toBeUndefined();
  });
});

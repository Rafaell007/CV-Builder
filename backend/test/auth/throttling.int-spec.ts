import { INestApplication } from "@nestjs/common";
import { createUser, TEST_PASSWORD } from "../support/create-user";
import { graphqlRequest } from "../support/graphql-request";

const SIGN_IN = `mutation ($input: SignInInput!) { signIn(input: $input) { id } }`;
const LIMIT = 3;

describe("throttling", () => {
  let app: INestApplication;
  let previousLimit: string | undefined;

  beforeAll(async () => {
    previousLimit = process.env["THROTTLE_LIMIT"];
    process.env["THROTTLE_LIMIT"] = String(LIMIT);
    // Imported only now: the config module reads the environment when `AppModule` is first loaded.
    const { createTestApp } = await import("../support/create-test-app.js");
    app = await createTestApp();
    await createUser(app, { email: "user1@example.com" });
  });

  afterAll(async () => {
    await app.close();
    if (previousLimit === undefined) delete process.env["THROTTLE_LIMIT"];
    else process.env["THROTTLE_LIMIT"] = previousLimit;
  });

  function signIn(password: string, headers: Record<string, string> = {}) {
    return graphqlRequest(app, SIGN_IN, {
      headers,
      variables: { input: { email: "user1@example.com", password } },
    });
  }

  it("blocks signIn after the limit, even with the right password, and sets no cookie", async () => {
    for (let attempt = 0; attempt < LIMIT; attempt++) {
      const { body } = await signIn("Wrong-password1");
      expect(body.errors?.[0]?.extensions.code).toBe("UNAUTHENTICATED"); // counted, not yet blocked
    }

    const blocked = await signIn(TEST_PASSWORD);

    expect(blocked.body.data).toBeNull();
    expect(blocked.body.errors?.[0]?.extensions.code).toBe("TOO_MANY_REQUESTS");
    expect(blocked.setCookies).toEqual([]);

    // TRUST_PROXY_HOPS is 0 here, so a faked X-Forwarded-For does not give the client a new IP.
    const faked = await signIn(TEST_PASSWORD, { "X-Forwarded-For": "203.0.113.99" });
    expect(faked.body.errors?.[0]?.extensions.code).toBe("TOO_MANY_REQUESTS");
  });

  it("blocks forgotPassword after the limit, so the mail of a user cannot be flooded", async () => {
    const forgotPassword = () =>
      graphqlRequest(
        app,
        `mutation ($input: ForgotPasswordInput!) { forgotPassword(input: $input) }`,
        {
          variables: { input: { email: "user1@example.com" } },
        },
      );

    for (let attempt = 0; attempt < LIMIT; attempt++) {
      const { body } = await forgotPassword();
      expect(body.data).toEqual({ forgotPassword: true }); // counted, not yet blocked
    }

    const blocked = await forgotPassword();

    expect(blocked.body.data).toBeNull();
    expect(blocked.body.errors?.[0]?.extensions.code).toBe("TOO_MANY_REQUESTS");
  });

  it("does not throttle the operations that D23 does not list", async () => {
    for (let attempt = 0; attempt < LIMIT + 2; attempt++) {
      const { body } = await graphqlRequest(app, "mutation { signOut }");
      expect(body).toEqual({ data: { signOut: true } });
    }
  });
});

import type { INestApplication } from "@nestjs/common";
import { createUser } from "./support/create-user";
import { graphqlRequest } from "./support/graphql-request";

const SIGN_IN = `mutation ($input: SignInInput!) { signIn(input: $input) { id } }`;
const LIMIT = 2;
const OVERRIDES = { THROTTLE_LIMIT: String(LIMIT), TRUST_PROXY_HOPS: "1" };

// Behind one proxy, the throttler must count each client IP from X-Forwarded-For, not the proxy's IP.
describe("throttling behind a proxy (TRUST_PROXY_HOPS=1)", () => {
  let app: INestApplication;
  const previous: Record<string, string | undefined> = {};

  beforeAll(async () => {
    for (const [name, value] of Object.entries(OVERRIDES)) {
      previous[name] = process.env[name];
      process.env[name] = value;
    }
    // Imported only now: the config module reads the environment when `AppModule` is first loaded.
    const { createTestApp } = await import("./support/create-test-app");
    app = await createTestApp();
    await createUser(app, { email: "user1@example.com" });
  });

  afterAll(async () => {
    await app.close();
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });

  function signInFrom(clientIp: string) {
    return graphqlRequest(app, SIGN_IN, {
      headers: { "X-Forwarded-For": clientIp },
      variables: { input: { email: "user1@example.com", password: "Wrong-password1" } },
    });
  }

  it("limits each client IP on its own", async () => {
    for (let attempt = 0; attempt < LIMIT; attempt++) {
      const { body } = await signInFrom("203.0.113.1");
      expect(body.errors?.[0]?.extensions.code).toBe("UNAUTHENTICATED");
    }

    const blocked = await signInFrom("203.0.113.1");
    const otherClient = await signInFrom("203.0.113.2");

    expect(blocked.body.errors?.[0]?.extensions.code).toBe("TOO_MANY_REQUESTS");
    expect(otherClient.body.errors?.[0]?.extensions.code).toBe("UNAUTHENTICATED");
  });
});

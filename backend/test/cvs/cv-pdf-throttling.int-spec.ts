import type { INestApplication } from "@nestjs/common";
import { createUser } from "../support/create-user";
import { graphqlRequest, toCookiePair } from "../support/graphql-request";

const SIGN_IN = `mutation ($input: SignInInput!) { signIn(input: $input) { id } }`;
const EXPORT = `query ($cvId: ID!) { exportCvPdf(cvId: $cvId) { fileName } }`;
const PREVIEW = `query ($cvId: ID!) { cvPreview(cvId: $cvId) { cvId } }`;
const LIMIT = 3;

describe("cv pdf export rate limit", () => {
  let app: INestApplication;
  let previousLimit: string | undefined;
  let cookie: string;
  let cvId: string;

  beforeAll(async () => {
    previousLimit = process.env["THROTTLE_LIMIT"];
    process.env["THROTTLE_LIMIT"] = String(LIMIT);
    // Imported only now: the config module reads the environment when `AppModule` is first loaded.
    const { createTestApp } = await import("../support/create-test-app.js");
    const { PrismaService } = await import("../../src/prisma/prisma.service.js");
    app = await createTestApp();

    const user = await createUser(app, { email: "limit@example.com" });
    const { setCookies } = await graphqlRequest(app, SIGN_IN, {
      variables: { input: { email: "limit@example.com", password: "Password123!" } },
    });
    cookie = toCookiePair(setCookies.find((item) => item.startsWith("access_token=")) ?? "");
    cvId = (
      await app
        .get(PrismaService)
        .cv.create({ data: { userId: user.id, name: "Limit", education: "", description: "" } })
    ).id;
  });

  afterAll(async () => {
    await app.close();
    if (previousLimit === undefined) delete process.env["THROTTLE_LIMIT"];
    else process.env["THROTTLE_LIMIT"] = previousLimit;
  });

  it("blocks exportCvPdf after the limit, with TOO_MANY_REQUESTS and no file", async () => {
    for (let attempt = 0; attempt < LIMIT; attempt++) {
      const { body } = await graphqlRequest(app, EXPORT, {
        cookies: [cookie],
        variables: { cvId },
      });
      expect(body.errors).toBeUndefined(); // counted, not yet blocked
    }

    const blocked = await graphqlRequest(app, EXPORT, { cookies: [cookie], variables: { cvId } });

    expect(blocked.body.data).toBeNull();
    expect(blocked.body.errors?.[0]?.extensions.code).toBe("TOO_MANY_REQUESTS");
  });

  it("does not limit the cvPreview query, which is cheap", async () => {
    for (let attempt = 0; attempt < LIMIT + 2; attempt++) {
      const { body } = await graphqlRequest(app, PREVIEW, {
        cookies: [cookie],
        variables: { cvId },
      });
      expect(body.errors).toBeUndefined();
    }
  });
});

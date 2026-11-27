import request from "supertest";
import type { NestExpressApplication } from "@nestjs/platform-express";
import {
  AVATAR_FILE_FIELD,
  AVATAR_READ_LIMIT,
} from "../../src/modules/users/avatars/avatars.constants";
import { createUser, TEST_PASSWORD } from "../support/create-user";
import { graphqlRequest, toCookiePair } from "../support/graphql-request";

const SIGN_IN = `mutation ($input: SignInInput!) { signIn(input: $input) { id } }`;
const LIMIT = 3;
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

describe("avatar REST rate limit", () => {
  let app: NestExpressApplication;
  let previousLimit: string | undefined;
  let userId: string;
  let cookie: string;

  beforeAll(async () => {
    previousLimit = process.env["THROTTLE_LIMIT"];
    process.env["THROTTLE_LIMIT"] = String(LIMIT);
    // Imported only now: the config module reads the environment when `AppModule` is first loaded.
    const { createTestApp } = await import("../support/create-test-app.js");
    app = await createTestApp();

    userId = (await createUser(app, { email: "limit@example.com" })).id;
    const { setCookies } = await graphqlRequest(app, SIGN_IN, {
      variables: { input: { email: "limit@example.com", password: TEST_PASSWORD } },
    });
    cookie = toCookiePair(setCookies.find((item) => item.startsWith("access_token=")) ?? "");
  });

  afterAll(async () => {
    await app.close();
    if (previousLimit === undefined) delete process.env["THROTTLE_LIMIT"];
    else process.env["THROTTLE_LIMIT"] = previousLimit;
  });

  const path = () => `/api/users/${userId}/avatar`;
  const upload = () =>
    request(app.getHttpServer())
      .post(path())
      .set("Cookie", cookie)
      .attach(AVATAR_FILE_FIELD, PNG, { filename: "a.png", contentType: "image/png" });
  const remove = () => request(app.getHttpServer()).delete(path()).set("Cookie", cookie);
  const download = () => request(app.getHttpServer()).get(path()).set("Cookie", cookie);

  it("blocks uploads after the limit with 429, the same answer as the GraphQL routes", async () => {
    for (let attempt = 0; attempt < LIMIT; attempt++) await upload().expect(204); // counted, not yet blocked

    const blocked = await upload().expect(429);

    expect((blocked.body as { message?: string }).message).toBe(
      "Too many attempts, try again later",
    );
  });

  it("counts a delete on its own and blocks it after the limit", async () => {
    for (let attempt = 0; attempt < LIMIT; attempt++) await remove().expect(204);

    await remove().expect(429);
  });

  it("limits reading an avatar higher than the shared limit, with its own count", async () => {
    // More than the shared limit of 3, so a page with many photos still works.
    for (let attempt = 0; attempt < AVATAR_READ_LIMIT; attempt++) await download().expect(404);

    await download().expect(429);
  });
});

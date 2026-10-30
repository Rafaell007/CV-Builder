import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { createTestApp } from "./support/create-test-app";

describe("health query", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("answers over HTTP", async () => {
    const response = await request(app.getHttpServer())
      .post("/graphql")
      .send({ query: "{ health { status } }" })
      .expect(200);

    expect(response.body).toEqual({ data: { health: { status: "ok" } } });
  });
});

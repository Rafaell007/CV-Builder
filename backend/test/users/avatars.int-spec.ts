import type { NestExpressApplication } from "@nestjs/platform-express";
import request from "supertest";
import { Role } from "../../src/generated/prisma/enums";
import {
  AVATAR_FILE_FIELD,
  AVATAR_MAX_BYTES,
  UNSUPPORTED_FILE_TYPE_REASON,
} from "../../src/modules/users/avatars/avatars.constants";
import { createTestApp } from "../support/create-test-app";
import { createUser, TEST_PASSWORD } from "../support/create-user";
import { graphqlRequest, toCookiePair } from "../support/graphql-request";

const SIGN_IN = `mutation ($input: SignInInput!) { signIn(input: $input) { id } }`;
const AVATAR_URL = `query ($id: ID!) { user(id: $id) { avatarUrl } }`;

const MISSING_ID = "00000000-0000-4000-8000-000000000000";

// Real 1×1 images (each decodes in an image library), small enough to keep here instead of binary files.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);
const GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
const JPG = Buffer.from(
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD50ooor8MP9Uz/2Q==",
  "base64",
);

/** A file of exactly `size` bytes that starts like a PNG: the upload checks only the first bytes. */
function pngOfSize(size: number): Buffer {
  const file = Buffer.alloc(size);
  PNG.copy(file);
  return file;
}

type Who = { id: string; cookie: string };

describe("avatars REST", () => {
  let app: NestExpressApplication;
  let admin: Who;
  let ann: Who;
  let ben: Who;

  async function addUser(email: string, role: Role = Role.USER): Promise<Who> {
    const user = await createUser(app, { email, role });
    const { setCookies } = await graphqlRequest(app, SIGN_IN, {
      variables: { input: { email, password: TEST_PASSWORD } },
    });
    const access = setCookies.find((cookie) => cookie.startsWith("access_token="));
    return { id: user.id, cookie: toCookiePair(access ?? "") };
  }

  const avatarPath = (userId: string) => `/api/users/${userId}/avatar`;
  const cookiesOf = (who: Who | null) => (who ? who.cookie : "");

  function upload(
    who: Who | null,
    userId: string,
    content: Buffer,
    { filename = "avatar.png", contentType = "image/png" } = {},
  ) {
    return request(app.getHttpServer())
      .post(avatarPath(userId))
      .set("Cookie", cookiesOf(who))
      .attach(AVATAR_FILE_FIELD, content, { filename, contentType });
  }

  function download(who: Who | null, userId: string) {
    return request(app.getHttpServer()).get(avatarPath(userId)).set("Cookie", cookiesOf(who));
  }

  function remove(who: Who | null, userId: string) {
    return request(app.getHttpServer()).delete(avatarPath(userId)).set("Cookie", cookiesOf(who));
  }

  async function avatarUrlOf(userId: string): Promise<unknown> {
    const { body } = await graphqlRequest(app, AVATAR_URL, {
      cookies: [ann.cookie],
      variables: { id: userId },
    });
    expect(body.errors).toBeUndefined();
    return (body.data?.["user"] as { avatarUrl: unknown }).avatarUrl;
  }

  beforeAll(async () => {
    app = await createTestApp();
    admin = await addUser("admin@example.com", Role.ADMIN);
    ann = await addUser("ann@example.com");
    ben = await addUser("ben@example.com");
  });

  afterAll(async () => {
    await app.close();
  });

  describe("upload and read", () => {
    it.each([
      ["a PNG", PNG, "avatar.png", "image/png"],
      ["a JPG", JPG, "avatar.jpg", "image/jpeg"],
      ["a GIF", GIF, "avatar.gif", "image/gif"],
    ])("stores %s and sends it back with safe headers", async (_name, content, filename, type) => {
      await upload(ann, ann.id, content, { filename, contentType: type }).expect(204);

      const response = await download(ben, ann.id).expect(200);

      expect(response.headers["content-type"]).toBe(type);
      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["cache-control"]).toBe("private, max-age=31536000, immutable");
      expect(Buffer.compare(response.body as Buffer, content)).toBe(0);
    });

    it("stores the type found in the content, not the type or name the browser sent", async () => {
      await upload(ann, ann.id, PNG, { filename: "photo.gif", contentType: "image/gif" }).expect(
        204,
      );

      const response = await download(ann, ann.id).expect(200);

      expect(response.headers["content-type"]).toBe("image/png");
    });

    it("accepts an image the browser sent without a type (e.g. a .jfif file)", async () => {
      await upload(ann, ann.id, JPG, {
        filename: "photo.jfif",
        contentType: "application/octet-stream",
      }).expect(204);

      const response = await download(ann, ann.id).expect(200);

      expect(response.headers["content-type"]).toBe("image/jpeg");
    });

    it("answers 404 without cache headers for a user without an avatar", async () => {
      await remove(ben, ben.id).expect(204);

      const response = await download(ann, ben.id).expect(404);

      expect(response.headers["cache-control"]).toBeUndefined();
      expect(response.headers["x-content-type-options"]).toBeUndefined();
    });
  });

  describe("file checks (AC-20 to AC-23)", () => {
    it("refuses a text file named .png with 415 UNSUPPORTED_FILE_TYPE", async () => {
      const response = await upload(ann, ann.id, Buffer.from("I am not an image")).expect(415);

      expect((response.body as { reason?: string }).reason).toBe(UNSUPPORTED_FILE_TYPE_REASON);
    });

    it("accepts a file of exactly 5 MB", async () => {
      await upload(ann, ann.id, pngOfSize(AVATAR_MAX_BYTES)).expect(204);
    });

    it("refuses a file of 5 MB + 1 byte with 413", async () => {
      await upload(ann, ann.id, pngOfSize(AVATAR_MAX_BYTES + 1)).expect(413);
    });

    it.each([
      ["a file of the wrong type", Buffer.from("<!doctype html>"), 415],
      ["a file that is too big", pngOfSize(AVATAR_MAX_BYTES + 1), 413],
    ])("keeps the old avatar after %s (AC-23)", async (_name, content, status) => {
      await upload(ann, ann.id, GIF, { filename: "old.gif", contentType: "image/gif" }).expect(204);

      await upload(ann, ann.id, content).expect(status);

      const response = await download(ann, ann.id).expect(200);
      expect(Buffer.compare(response.body as Buffer, GIF)).toBe(0);
    });

    it("answers 400 without a file", async () => {
      await request(app.getHttpServer())
        .post(avatarPath(ann.id))
        .set("Cookie", ann.cookie)
        .field("note", "no file here")
        .expect(400);
      await request(app.getHttpServer())
        .post(avatarPath(ann.id))
        .set("Cookie", ann.cookie)
        .expect(400);
    });

    it("answers 400 for an extra form field next to the file", async () => {
      await upload(ann, ann.id, PNG).field("note", "extra").expect(400);
    });

    it("answers 400 for a second file", async () => {
      await upload(ann, ann.id, PNG)
        .attach(AVATAR_FILE_FIELD, GIF, { filename: "two.gif", contentType: "image/gif" })
        .expect(400);
    });
  });

  describe("who may do what (PLAN.md §7)", () => {
    it("refuses another user's upload and delete with 403 and keeps the avatar", async () => {
      await upload(ann, ann.id, PNG).expect(204);

      await upload(ben, ann.id, GIF, { filename: "b.gif", contentType: "image/gif" }).expect(403);
      await remove(ben, ann.id).expect(403);

      const response = await download(ann, ann.id).expect(200);
      expect(Buffer.compare(response.body as Buffer, PNG)).toBe(0);
    });

    it("lets an admin upload and remove the avatar of another user", async () => {
      await upload(admin, ben.id, JPG, { filename: "a.jpg", contentType: "image/jpeg" }).expect(
        204,
      );
      const response = await download(ben, ben.id).expect(200);
      expect(Buffer.compare(response.body as Buffer, JPG)).toBe(0);

      await remove(admin, ben.id).expect(204);
      await download(ben, ben.id).expect(404);
    });

    it("answers 403 to a user for an unknown id, so ids cannot be probed", async () => {
      await upload(ben, MISSING_ID, PNG).expect(403);
      await remove(ben, MISSING_ID).expect(403);
    });

    it("answers 404 to an admin for an unknown id", async () => {
      await upload(admin, MISSING_ID, PNG).expect(404);
      await remove(admin, MISSING_ID).expect(404);
    });

    it("answers 401 without a session", async () => {
      await download(null, ann.id).expect(401);
      await upload(null, ann.id, PNG).expect(401);
      await remove(null, ann.id).expect(401);
    });

    it("answers HEAD like GET, so the frontend can ask why an image failed to load", async () => {
      await upload(ann, ann.id, PNG).expect(204);
      const head = (who: Who | null) =>
        request(app.getHttpServer()).head(avatarPath(ann.id)).set("Cookie", cookiesOf(who));

      await head(null).expect(401);
      await head(ben).expect(200);
    });

    it("answers 400 for an id that is not a UUID", async () => {
      await download(ann, "not-a-uuid").expect(400);
      await upload(ann, "not-a-uuid", PNG).expect(400);
      await remove(ann, "not-a-uuid").expect(400);
    });
  });

  describe("delete", () => {
    it("removes the avatar, and a second delete is fine too", async () => {
      await upload(ann, ann.id, PNG).expect(204);

      await remove(ann, ann.id).expect(204);
      await download(ann, ann.id).expect(404);
      await remove(ann, ann.id).expect(204);
    });
  });

  describe("User.avatarUrl", () => {
    it("is null without an avatar, changes with each upload and is null again after delete", async () => {
      await remove(ann, ann.id).expect(204);
      expect(await avatarUrlOf(ann.id)).toBeNull();

      await upload(ann, ann.id, PNG).expect(204);
      const first = await avatarUrlOf(ann.id);
      expect(first).toMatch(new RegExp(`^/api/users/${ann.id}/avatar\\?v=\\d+$`));

      await upload(ann, ann.id, GIF, { filename: "new.gif", contentType: "image/gif" }).expect(204);
      const second = await avatarUrlOf(ann.id);
      expect(second).toMatch(new RegExp(`^/api/users/${ann.id}/avatar\\?v=\\d+$`));
      expect(second).not.toBe(first);

      await remove(ann, ann.id).expect(204);
      expect(await avatarUrlOf(ann.id)).toBeNull();
    });

    it("points to an address that serves the image", async () => {
      await upload(ann, ann.id, PNG).expect(204);
      const url = (await avatarUrlOf(ann.id)) as string;

      const response = await request(app.getHttpServer())
        .get(url)
        .set("Cookie", ann.cookie)
        .expect(200);

      expect(response.headers["content-type"]).toBe("image/png");
    });
  });
});

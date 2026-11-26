import { avatarUrl, avatarVersion } from "./avatar-url.utils";

const USER_ID = "8d1b6f2e-3c4a-4b5d-9e6f-7a8b9c0d1e2f";

describe("avatarUrl", () => {
  it("points to the avatar endpoint with the upload time as the version", () => {
    const updatedAt = new Date("2026-11-26T10:00:00.000Z");

    expect(avatarUrl(USER_ID, updatedAt)).toBe(
      `/api/users/${USER_ID}/avatar?v=${updatedAt.getTime()}`,
    );
  });

  it("gives a new address after a new upload", () => {
    const first = avatarUrl(USER_ID, new Date("2026-11-26T10:00:00.000Z"));
    const second = avatarUrl(USER_ID, new Date("2026-11-26T10:00:01.000Z"));

    expect(second).not.toBe(first);
  });

  it("is null for a user without an avatar", () => {
    expect(avatarUrl(USER_ID, null)).toBeNull();
  });
});

describe("avatarVersion", () => {
  it("is the upload time in milliseconds, the same as in avatarUrl", () => {
    const updatedAt = new Date("2026-11-26T10:00:00.000Z");

    expect(avatarVersion(updatedAt)).toBe(String(updatedAt.getTime()));
    expect(avatarUrl(USER_ID, updatedAt)?.endsWith(`?v=${avatarVersion(updatedAt)}`)).toBe(true);
  });
});

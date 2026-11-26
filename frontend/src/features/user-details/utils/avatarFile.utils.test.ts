import { describe, expect, it } from "vitest";
import { AVATAR_MAX_BYTES } from "../user-details.constants";
import { checkAvatarFile } from "./avatarFile.utils";

describe("checkAvatarFile", () => {
  it.each(["image/png", "image/jpeg", "image/gif"])("accepts a %s image", (type) => {
    expect(checkAvatarFile({ type, size: 1024 })).toBe("ok");
  });

  it.each(["image/webp", "image/svg+xml", "application/pdf", "text/plain", ""])(
    "refuses the type %j",
    (type) => {
      expect(checkAvatarFile({ type, size: 1024 })).toBe("wrongType");
    },
  );

  it("accepts a file of exactly 5 MB", () => {
    expect(checkAvatarFile({ type: "image/png", size: AVATAR_MAX_BYTES })).toBe("ok");
  });

  it("refuses a file one byte over 5 MB", () => {
    expect(checkAvatarFile({ type: "image/png", size: AVATAR_MAX_BYTES + 1 })).toBe("tooLarge");
  });

  it("reports the wrong type first when both are wrong", () => {
    expect(checkAvatarFile({ type: "text/plain", size: AVATAR_MAX_BYTES + 1 })).toBe("wrongType");
  });

  it("works with a real File", () => {
    const file = new File([new Uint8Array(10)], "photo.png", { type: "image/png" });
    expect(checkAvatarFile(file)).toBe("ok");
  });
});

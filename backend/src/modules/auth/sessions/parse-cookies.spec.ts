import { readCookie } from "./parse-cookies";

describe("readCookie", () => {
  it("finds a cookie among several", () => {
    expect(readCookie("theme=dark; access_token=abc.def; lang=en", "access_token")).toBe("abc.def");
  });

  it("does not match a cookie whose name only ends with the wanted name", () => {
    expect(readCookie("old_access_token=nope", "access_token")).toBeUndefined();
  });

  it("keeps an equals sign inside the value", () => {
    expect(readCookie("refresh_token=a=b", "refresh_token")).toBe("a=b");
  });

  it("decodes percent-encoded values", () => {
    expect(readCookie("refresh_token=a%20b", "refresh_token")).toBe("a b");
  });

  it.each([undefined, "", "other=1", "access_token=", "access_token"])(
    "returns undefined for the header %p",
    (header) => {
      expect(readCookie(header, "access_token")).toBeUndefined();
    },
  );

  it("returns undefined for a broken percent sequence", () => {
    expect(readCookie("access_token=%E0%A4%A", "access_token")).toBeUndefined();
  });
});

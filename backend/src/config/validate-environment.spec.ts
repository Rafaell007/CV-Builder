import { validateEnvironment } from "./validate-environment";

const DATABASE_URL = "postgresql://cv_builder:cv_builder@localhost:5432/cv_builder";

describe("validateEnvironment", () => {
  it("defaults PORT to 4000 when it is not set", () => {
    expect(validateEnvironment({ DATABASE_URL }).PORT).toBe(4000);
  });

  it("converts PORT from a string to a number", () => {
    expect(validateEnvironment({ DATABASE_URL, PORT: "5000" }).PORT).toBe(5000);
  });

  it.each(["abc", "0", "70000"])("throws for invalid PORT %s", (port) => {
    expect(() => validateEnvironment({ DATABASE_URL, PORT: port })).toThrow(
      /Invalid environment variables:\nPORT/,
    );
  });

  it.each([
    "postgresql://cv_builder:cv_builder@localhost:5432/cv_builder",
    "postgres://user:pass@db.example.com:5432/app",
    "postgresql://user:p%40ss@postgres:5432/app?sslmode=require",
  ])("accepts DATABASE_URL %s", (url) => {
    expect(validateEnvironment({ DATABASE_URL: url }).DATABASE_URL).toBe(url);
  });

  it("throws and names DATABASE_URL when it is missing", () => {
    expect(() => validateEnvironment({})).toThrow(/Invalid environment variables:\nDATABASE_URL/);
  });

  it.each(["", "not-a-url", "mysql://user:pass@localhost:3306/db", "localhost:5432/db"])(
    "throws for invalid DATABASE_URL %p",
    (url) => {
      expect(() => validateEnvironment({ DATABASE_URL: url })).toThrow(
        /Invalid environment variables:\nDATABASE_URL/,
      );
    },
  );

  it("lists every invalid variable in one error", () => {
    expect(() => validateEnvironment({ PORT: "abc" })).toThrow(/PORT: .*\nDATABASE_URL: /s);
  });
});

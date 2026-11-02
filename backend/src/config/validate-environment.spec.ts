import { validateEnvironment } from "./validate-environment";

const DATABASE_URL = "postgresql://cv_builder:cv_builder@localhost:5432/cv_builder";
const JWT_ACCESS_SECRET = "a".repeat(32);
const JWT_REFRESH_SECRET = "b".repeat(32);
const VALID = { DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET };

describe("validateEnvironment", () => {
  it("defaults PORT to 4000 when it is not set", () => {
    expect(validateEnvironment(VALID).PORT).toBe(4000);
  });

  it("defaults the rate limit to 10 calls per 60 seconds", () => {
    const environment = validateEnvironment(VALID);

    expect(environment.THROTTLE_LIMIT).toBe(10);
    expect(environment.THROTTLE_TTL_SECONDS).toBe(60);
  });

  it.each(["THROTTLE_LIMIT", "THROTTLE_TTL_SECONDS"])("throws for %s below 1", (name) => {
    expect(() => validateEnvironment({ ...VALID, [name]: "0" })).toThrow(
      new RegExp(`Invalid environment variables:\\n${name}`),
    );
  });

  it("trusts no proxy by default and accepts a number of proxies", () => {
    expect(validateEnvironment(VALID).TRUST_PROXY_HOPS).toBe(0);
    expect(validateEnvironment({ ...VALID, TRUST_PROXY_HOPS: "1" }).TRUST_PROXY_HOPS).toBe(1);
  });

  it.each(["-1", "1.5", "yes"])("throws for invalid TRUST_PROXY_HOPS %s", (hops) => {
    expect(() => validateEnvironment({ ...VALID, TRUST_PROXY_HOPS: hops })).toThrow(
      /Invalid environment variables:\nTRUST_PROXY_HOPS/,
    );
  });

  it("converts PORT from a string to a number", () => {
    expect(validateEnvironment({ ...VALID, PORT: "5000" }).PORT).toBe(5000);
  });

  it.each(["abc", "0", "70000"])("throws for invalid PORT %s", (port) => {
    expect(() => validateEnvironment({ ...VALID, PORT: port })).toThrow(
      /Invalid environment variables:\nPORT/,
    );
  });

  it.each([
    "postgresql://cv_builder:cv_builder@localhost:5432/cv_builder",
    "postgres://user:pass@db.example.com:5432/app",
    "postgresql://user:p%40ss@postgres:5432/app?sslmode=require",
  ])("accepts DATABASE_URL %s", (url) => {
    expect(validateEnvironment({ ...VALID, DATABASE_URL: url }).DATABASE_URL).toBe(url);
  });

  it("throws and names DATABASE_URL when it is missing", () => {
    expect(() => validateEnvironment({ JWT_ACCESS_SECRET, JWT_REFRESH_SECRET })).toThrow(
      /Invalid environment variables:\nDATABASE_URL/,
    );
  });

  it.each(["", "not-a-url", "mysql://user:pass@localhost:3306/db", "localhost:5432/db"])(
    "throws for invalid DATABASE_URL %p",
    (url) => {
      expect(() => validateEnvironment({ ...VALID, DATABASE_URL: url })).toThrow(
        /Invalid environment variables:\nDATABASE_URL/,
      );
    },
  );

  it("defaults NODE_ENV to development", () => {
    expect(validateEnvironment(VALID).NODE_ENV).toBe("development");
  });

  it("throws for an unknown NODE_ENV", () => {
    expect(() => validateEnvironment({ ...VALID, NODE_ENV: "staging" })).toThrow(
      /Invalid environment variables:\nNODE_ENV/,
    );
  });

  it.each(["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"])("throws when %s is missing", (name) => {
    expect(() => validateEnvironment({ ...VALID, [name]: undefined })).toThrow(
      new RegExp(`Invalid environment variables:\\n${name}`),
    );
  });

  it.each(["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"])("throws when %s is too short", (name) => {
    expect(() => validateEnvironment({ ...VALID, [name]: "short" })).toThrow(
      new RegExp(`${name}: .*32`),
    );
  });

  it("defaults the mail settings to Mailpit and the local frontend", () => {
    const environment = validateEnvironment(VALID);

    expect(environment.FRONTEND_URL).toBe("http://localhost:3000");
    expect(environment.SMTP_HOST).toBe("localhost");
    expect(environment.SMTP_PORT).toBe(1025);
    expect(environment.SMTP_USER).toBeUndefined();
    expect(environment.MAIL_FROM).toContain("no-reply@");
  });

  it("converts SMTP_PORT from a string to a number", () => {
    expect(validateEnvironment({ ...VALID, SMTP_PORT: "587" }).SMTP_PORT).toBe(587);
  });

  it.each(["abc", "0", "70000"])("throws for invalid SMTP_PORT %s", (port) => {
    expect(() => validateEnvironment({ ...VALID, SMTP_PORT: port })).toThrow(
      /Invalid environment variables:\nSMTP_PORT/,
    );
  });

  it.each(["", "not-a-url", "localhost:3000"])("throws for invalid FRONTEND_URL %p", (url) => {
    expect(() => validateEnvironment({ ...VALID, FRONTEND_URL: url })).toThrow(
      /Invalid environment variables:\nFRONTEND_URL/,
    );
  });

  describe("in production", () => {
    const MAIL = {
      FRONTEND_URL: "https://cv.example.com",
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: "465",
      MAIL_FROM: "CV Builder <no-reply@example.com>",
    };
    const PRODUCTION = { ...VALID, NODE_ENV: "production", ...MAIL };

    it("accepts the environment when the mail settings are set", () => {
      expect(validateEnvironment(PRODUCTION).FRONTEND_URL).toBe("https://cv.example.com");
    });

    it.each(Object.keys(MAIL))("throws when %s is not set", (name) => {
      expect(() => validateEnvironment({ ...PRODUCTION, [name]: undefined })).toThrow(
        new RegExp(`Invalid environment variables:\\n${name}: must be set in production`),
      );
    });
  });

  describe("SMTP login", () => {
    it.each([
      ["SMTP_USER", { SMTP_USER: "user" }],
      ["SMTP_PASS", { SMTP_PASS: "secret" }],
    ])("throws when only %s is set", (_name, login) => {
      expect(() => validateEnvironment({ ...VALID, ...login })).toThrow(
        /Invalid environment variables:\nSMTP_USER: .*together/,
      );
    });

    it("accepts both set, or both empty as in .env.example", () => {
      expect(() => validateEnvironment({ ...VALID, SMTP_USER: "u", SMTP_PASS: "p" })).not.toThrow();
      expect(() => validateEnvironment({ ...VALID, SMTP_USER: "", SMTP_PASS: "" })).not.toThrow();
    });
  });

  it("lists every invalid variable in one error", () => {
    expect(() => validateEnvironment({ PORT: "abc" })).toThrow(/PORT: .*\nDATABASE_URL: /s);
  });
});

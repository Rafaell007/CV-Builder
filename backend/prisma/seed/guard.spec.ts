import { assertSeedAllowed } from "./guard";

const LOCAL_URL = "postgresql://cv_builder:cv_builder@localhost:5432/cv_builder";
const REMOTE_URL = "postgresql://owner:secret@ep-demo.eu-central-1.aws.neon.tech/cv_builder";

describe("assertSeedAllowed", () => {
  describe("allowed", () => {
    it.each([
      ["localhost", LOCAL_URL, {}],
      ["127.0.0.1", "postgresql://u:p@127.0.0.1:5432/cv_builder", {}],
      ["an upper case LOCALHOST", "postgresql://u:p@LOCALHOST:5432/cv_builder", {}],
      ["NODE_ENV development", LOCAL_URL, { NODE_ENV: "development" }],
      ["NODE_ENV test", LOCAL_URL, { NODE_ENV: "test" }],
      [
        "a remote host with a database that ends in _test",
        REMOTE_URL.replace("cv_builder", "cv_builder_test"),
        {},
      ],
      ["a remote host with SEED_ALLOW_REMOTE=1", REMOTE_URL, { SEED_ALLOW_REMOTE: "1" }],
    ])("seeds %s", (_label, url, env) => {
      expect(() => assertSeedAllowed(url, env)).not.toThrow();
    });
  });

  describe("refused", () => {
    it("refuses NODE_ENV production, also on localhost", () => {
      expect(() => assertSeedAllowed(LOCAL_URL, { NODE_ENV: "production" })).toThrow(/production/);
    });

    it("refuses NODE_ENV production even with SEED_ALLOW_REMOTE=1", () => {
      expect(() =>
        assertSeedAllowed(REMOTE_URL, { NODE_ENV: "production", SEED_ALLOW_REMOTE: "1" }),
      ).toThrow(/production/);
    });

    it("refuses a remote host and names the override", () => {
      expect(() => assertSeedAllowed(REMOTE_URL, {})).toThrow(
        /ep-demo\.eu-central-1\.aws\.neon\.tech.*SEED_ALLOW_REMOTE/s,
      );
    });

    it.each([
      [
        "a host that only starts with localhost",
        "postgresql://u:p@localhost.example.com:5432/cv_builder",
      ],
      [
        "a host that only contains 127.0.0.1",
        "postgresql://u:p@127.0.0.1.example.com:5432/cv_builder",
      ],
      [
        "a database name that ends in test without an underscore",
        "postgresql://u:p@db.example.com:5432/latest",
      ],
      [
        "the IPv6 loopback host, which is not on the allowed list",
        "postgresql://u:p@[::1]:5432/cv_builder",
      ],
    ])("refuses %s", (_label, url) => {
      expect(() => assertSeedAllowed(url, {})).toThrow(/SEED_ALLOW_REMOTE/);
    });

    it.each(["0", "true", "yes", ""])(
      "does not accept SEED_ALLOW_REMOTE=%j as the override",
      (value) => {
        expect(() => assertSeedAllowed(REMOTE_URL, { SEED_ALLOW_REMOTE: value })).toThrow(
          /SEED_ALLOW_REMOTE/,
        );
      },
    );

    it("uses the host query parameter, because the pg driver connects to it instead of the address host", () => {
      expect(() =>
        assertSeedAllowed("postgresql://u:p@localhost:5432/cv_builder?host=db.example.com", {}),
      ).toThrow(/db\.example\.com.*SEED_ALLOW_REMOTE/s);
    });

    it("refuses a host query parameter that is a socket path", () => {
      expect(() =>
        assertSeedAllowed("postgresql://u:p@localhost/cv_builder?host=/var/run/postgresql", {}),
      ).toThrow(/SEED_ALLOW_REMOTE/);
    });

    it("keeps the connection string out of the error when it is not a URL", () => {
      let error: unknown;
      try {
        assertSeedAllowed("not a url, password secret", {});
      } catch (caught) {
        error = caught;
      }

      expect(error).toEqual(new Error("Refusing to seed: DATABASE_URL is not a valid URL."));
      expect(JSON.stringify(error, Object.getOwnPropertyNames(error))).not.toContain("secret");
    });

    it("keeps the password out of the error message", () => {
      expect(() => assertSeedAllowed(REMOTE_URL, {})).toThrow(
        expect.objectContaining({ message: expect.not.stringContaining("secret") }),
      );
    });
  });
});

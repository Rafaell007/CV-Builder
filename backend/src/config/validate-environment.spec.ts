import { validateEnvironment } from "./validate-environment";

describe("validateEnvironment", () => {
  it("defaults PORT to 4000 when it is not set", () => {
    expect(validateEnvironment({}).PORT).toBe(4000);
  });

  it("converts PORT from a string to a number", () => {
    expect(validateEnvironment({ PORT: "5000" }).PORT).toBe(5000);
  });

  it.each(["abc", "0", "70000"])("throws for invalid PORT %s", (port) => {
    expect(() => validateEnvironment({ PORT: port })).toThrow(
      /Invalid environment variables:\nPORT/,
    );
  });
});

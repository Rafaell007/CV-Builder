import { afterEach, describe, expect, it, vi } from "vitest";

// The real package throws when it is imported outside a Server Component.
vi.mock("server-only", () => ({}));

describe("serverEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    // The value is read when the module loads, so each test needs a fresh copy.
    vi.resetModules();
  });

  it("reads the backend origin from BACKEND_URL", async () => {
    vi.stubEnv("BACKEND_URL", "http://backend.test:4000");

    const { serverEnv } = await import("./env");

    expect(serverEnv.backendUrl).toBe("http://backend.test:4000");
  });

  it("fails fast when BACKEND_URL is missing", async () => {
    vi.stubEnv("BACKEND_URL", "");

    await expect(import("./env")).rejects.toThrow("Missing env variable: BACKEND_URL");
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const assign = vi.fn();

// The module keeps a "already redirecting" flag, so each test loads a fresh copy.
async function loadRedirect() {
  vi.resetModules();
  return (await import("./redirectToSignIn")).redirectToSignIn;
}

function stubLocation(pathname: string) {
  vi.stubGlobal("location", { assign, pathname });
}

beforeEach(() => {
  stubLocation("/pl/users");
});

afterEach(() => {
  vi.unstubAllGlobals();
  assign.mockClear();
});

describe("redirectToSignIn", () => {
  it("loads the sign-in page in the current language", async () => {
    const redirectToSignIn = await loadRedirect();

    const started = redirectToSignIn();

    expect(assign).toHaveBeenCalledWith("/pl/sign-in");
    expect(started).toBe(true);
  });

  it("does nothing on the sign-in page, so it cannot reload in a loop", async () => {
    stubLocation("/pl/sign-in");
    const redirectToSignIn = await loadRedirect();

    const started = redirectToSignIn();

    expect(assign).not.toHaveBeenCalled();
    expect(started).toBe(false);
  });

  it("leaves the language to the proxy when the path has none", async () => {
    stubLocation("/users");
    const redirectToSignIn = await loadRedirect();

    redirectToSignIn();

    expect(assign).toHaveBeenCalledWith("/sign-in");
  });

  it("redirects only once when several requests end the session", async () => {
    const redirectToSignIn = await loadRedirect();

    const results = [redirectToSignIn(), redirectToSignIn()];

    expect(assign).toHaveBeenCalledTimes(1);
    expect(results).toEqual([true, true]);
  });
});

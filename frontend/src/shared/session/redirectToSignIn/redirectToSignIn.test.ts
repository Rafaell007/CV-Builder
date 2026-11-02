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
  stubLocation("/users");
});

afterEach(() => {
  vi.unstubAllGlobals();
  assign.mockClear();
});

describe("redirectToSignIn", () => {
  it("loads the sign-in page", async () => {
    const redirectToSignIn = await loadRedirect();

    redirectToSignIn();

    expect(assign).toHaveBeenCalledWith("/sign-in");
  });

  it("does nothing on the sign-in page, so it cannot reload in a loop", async () => {
    stubLocation("/sign-in");
    const redirectToSignIn = await loadRedirect();

    redirectToSignIn();

    expect(assign).not.toHaveBeenCalled();
  });

  it("redirects only once when several requests end the session", async () => {
    const redirectToSignIn = await loadRedirect();

    redirectToSignIn();
    redirectToSignIn();

    expect(assign).toHaveBeenCalledTimes(1);
  });
});

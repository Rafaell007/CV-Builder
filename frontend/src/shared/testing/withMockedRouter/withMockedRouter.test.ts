import { describe, expect, it, vi } from "vitest";
import * as i18n from "@/shared/i18n";
import { withMockedRouter } from "./withMockedRouter";

describe("withMockedRouter", () => {
  it("replaces useRouter with a stub that has the given methods", () => {
    const push = vi.fn();

    const mocked = withMockedRouter(i18n, () => ({ push }));

    expect(mocked.useRouter()).toEqual({ push });
  });

  it("reads the stub on every useRouter call, so later declared mocks work", () => {
    let push = vi.fn();
    const mocked = withMockedRouter(i18n, () => ({ push }));
    push = vi.fn();

    expect(mocked.useRouter().push).toBe(push);
  });

  it("keeps the other exports of the module", () => {
    const mocked = withMockedRouter(i18n, () => ({}));

    expect(mocked.routing).toBe(i18n.routing);
    expect(mocked.Link).toBe(i18n.Link);
  });
});

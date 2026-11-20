// Not in a folder like other tested files: next-intl finds this config by its path, `src/i18n/request.ts`.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadMessages } from "./loadMessages";
import getConfig from "./request";

const rootLocale = vi.hoisted(() => vi.fn());
const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
  }),
);

// next-intl hands the function to its own loader; here the function itself is the export.
vi.mock("next-intl/server", () => ({ getRequestConfig: (config: unknown) => config }));
vi.mock("next/root-params", () => ({ locale: rootLocale }));
// Only notFound is replaced: the routing code that `@/shared/i18n` loads needs the rest of the module.
vi.mock(import("next/navigation"), async (importOriginal) => ({
  ...(await importOriginal()),
  notFound: notFound as unknown as typeof import("next/navigation").notFound,
}));

const requestConfig = getConfig as unknown as () => Promise<{ locale: string; messages: unknown }>;

describe("request config", () => {
  beforeEach(() => {
    notFound.mockClear();
  });

  it("gives the locale of the URL segment and its messages", async () => {
    rootLocale.mockResolvedValue("pl");

    await expect(requestConfig()).resolves.toEqual({
      locale: "pl",
      messages: await loadMessages("pl"),
    });
  });

  it("answers 404 for a locale the app does not support", async () => {
    rootLocale.mockResolvedValue("xx");

    await expect(requestConfig()).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
    expect(notFound).toHaveBeenCalledOnce();
  });
});

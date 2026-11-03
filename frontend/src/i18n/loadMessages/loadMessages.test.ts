import { describe, expect, it } from "vitest";
import { routing } from "@/shared/i18n";
import { loadMessages } from "./loadMessages";

// Every key path of a messages object, e.g. "common.appName".
const keyPaths = (value: unknown, prefix = ""): string[] =>
  typeof value === "object" && value !== null
    ? Object.entries(value).flatMap(([key, child]) => keyPaths(child, `${prefix}${key}.`))
    : [prefix.slice(0, -1)];

describe("loadMessages", () => {
  it.each(routing.locales)("loads messages for %s", async (locale) => {
    expect(keyPaths(await loadMessages(locale))).toContain("common.appName");
  });

  it.each(routing.locales.filter((locale) => locale !== routing.defaultLocale))(
    "gives %s exactly the keys of the default language",
    async (locale) => {
      const reference = keyPaths(await loadMessages(routing.defaultLocale)).sort();

      expect(keyPaths(await loadMessages(locale)).sort()).toEqual(reference);
    },
  );
});

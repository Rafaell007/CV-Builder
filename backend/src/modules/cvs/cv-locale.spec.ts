import { CV_LOCALES, DEFAULT_CV_LOCALE, OPEN_PERIOD_WORDS } from "./cv-locale";

describe("cv locales", () => {
  it("are English and Polish, the languages of the frontend, with English as the default", () => {
    expect([...CV_LOCALES]).toEqual(["en", "pl"]);
    expect(DEFAULT_CV_LOCALE).toBe("en");
  });

  it("have a word for an open period in every language", () => {
    expect(Object.keys(OPEN_PERIOD_WORDS).sort()).toEqual([...CV_LOCALES].sort());
    expect(OPEN_PERIOD_WORDS.en).toBe("Till now");
    expect(OPEN_PERIOD_WORDS.pl).toBe("obecnie");
  });
});
